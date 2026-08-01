import pandas as pd
from io import BytesIO
from typing import Dict

# 欄位對應（支援中英文欄位名稱）
COLUMN_ALIASES = {
    "month":        ["月份", "月", "month", "Month"],
    "electricity":  ["用電度數(kWh)", "用電度數", "用電量(kWh)", "電力(kWh)", "electricity", "kWh"],
    "diesel":       ["柴油(公升)", "柴油", "diesel", "Diesel"],
    "gasoline":     ["汽油(公升)", "汽油", "gasoline", "Gasoline"],
    "natural_gas":  ["天然氣(m³)", "天然氣", "natural_gas"],
    "lpg":          ["液化石油氣(kg)", "LPG", "lpg"],
    "heavy_oil":    ["重油(公升)", "重油", "heavy_oil"],
    "commute_car": ["員工通勤-轎車(公里)", "通勤轎車(km)", "commute_car"],
    "commute_public_transport": ["員工通勤-大眾運輸(公里)", "通勤大眾運輸(km)", "commute_public_transport"],
    "waste_general": ["一般廢棄物(公斤)", "廢棄物(kg)", "waste_general"],
    "waste_recycling": ["資源回收物(公斤)", "回收物(kg)", "waste_recycling"],
    "water_supply": ["自來水(立方公尺)", "用水(m³)", "water_supply"],
    "business_travel_air_domestic": ["商務差旅-國內航空(公里)", "國內差旅(km)", "business_travel_air_domestic"],
    "business_travel_air_international": ["商務差旅-國際航空(公里)", "國際差旅(km)", "business_travel_air_international"],
}

def _find_column(df: pd.DataFrame, aliases: list) -> str | None:
    for alias in aliases:
        if alias in df.columns:
            return alias
    return None

def parse_excel(file_bytes: bytes) -> Dict:
    """
    解析標準模板 Excel，回傳活動數據列表與錯誤列表
    回傳格式：{"data": [...], "errors": [{"row": N, "error": "說明"}]}
    """
    df = pd.read_excel(BytesIO(file_bytes), sheet_name=0)
    df.columns = df.columns.str.strip()

    # 找月份欄
    month_col = _find_column(df, COLUMN_ALIASES["month"])
    if month_col is None:
        raise ValueError("找不到「月份」欄位，請確認使用標準模板")

    records = []
    errors = []
    source_units = {
        "electricity": "kWh",
        "diesel": "公升",
        "gasoline": "公升",
        "natural_gas": "立方公尺",
        "lpg": "公斤",
        "heavy_oil": "公升",
        "commute_car": "公里",
        "commute_public_transport": "公里",
        "waste_general": "公斤",
        "waste_recycling": "公斤",
        "water_supply": "立方公尺",
        "business_travel_air_domestic": "公里",
        "business_travel_air_international": "公里",
    }

    for idx, row in df.iterrows():
        row_num = idx + 2 # Excel row number (1-based, plus header)
        month_val = row[month_col]
        if pd.isna(month_val):
            continue
        try:
            month = int(month_val)
            if not (1 <= month <= 12):
                errors.append({"row": row_num, "error": f"月份無效: {month_val}"})
                continue
        except Exception:
            errors.append({"row": row_num, "error": f"月份格式錯誤: {month_val}"})
            continue

        for source_type, aliases in COLUMN_ALIASES.items():
            if source_type == "month":
                continue
            col = _find_column(df, aliases)
            if col is None:
                continue
            val = row[col]
            if pd.isna(val) or val == 0:
                continue
            try:
                amount = float(val)
                if amount < 0:
                    errors.append({"row": row_num, "error": f"{source_type} 數值不可為負數: {val}"})
                    continue
                records.append({
                    "month": month,
                    "source_type": source_type,
                    "amount": amount,
                    "unit": source_units.get(source_type, "單位"),
                })
            except Exception:
                errors.append({"row": row_num, "error": f"{source_type} 數值無效: {val}"})

    return {"data": records, "errors": errors}

def get_template_bytes() -> bytes:
    """產生標準模板 Excel"""
    data = {
        "月份": list(range(1, 13)),
        "用電度數(kWh)": [None] * 12,
        "柴油(公升)": [None] * 12,
        "汽油(公升)": [None] * 12,
        "天然氣(m³)": [None] * 12,
        "液化石油氣(kg)": [None] * 12,
        "重油(公升)": [None] * 12,
        "員工通勤-轎車(公里)": [None] * 12,
        "員工通勤-大眾運輸(公里)": [None] * 12,
        "一般廢棄物(公斤)": [None] * 12,
        "資源回收物(公斤)": [None] * 12,
        "自來水(立方公尺)": [None] * 12,
        "商務差旅-國內航空(公里)": [None] * 12,
        "商務差旅-國際航空(公里)": [None] * 12,
    }
    df = pd.DataFrame(data)
    output = BytesIO()
    df.to_excel(output, index=False, sheet_name="活動數據")
    output.seek(0)
    return output.read()
