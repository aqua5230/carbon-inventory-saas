import json
from pathlib import Path

# 載入排放係數
_factors_path = Path(__file__).parent.parent / "data" / "emission_factors.json"
with open(_factors_path, "r", encoding="utf-8") as f:
    EMISSION_DATA = json.load(f)

FACTORS = EMISSION_DATA["factors"]

def get_factor(source_type: str) -> dict:
    if source_type not in FACTORS:
        raise ValueError(f"未知的排放源類型：{source_type}。支援：{list(FACTORS.keys())}")
    return FACTORS[source_type]

def calculate(source_type: str, amount: float) -> dict:
    """
    計算碳排放量
    回傳：co2e_kg, co2e_tonnes, scope, factor_value, factor_source
    """
    factor = get_factor(source_type)
    co2e_kg = amount * factor["co2e_per_unit"]
    co2e_tonnes = co2e_kg / 1000

    return {
        "source_type": source_type,
        "source_name": factor["name"],
        "amount": amount,
        "unit": factor["unit"],
        "factor_value": factor["co2e_per_unit"],
        "factor_source": factor["source"],
        "co2e_kg": round(co2e_kg, 4),
        "co2e_tonnes": round(co2e_tonnes, 6),
        "scope": factor["scope"],
        "calculation": f"{amount} {factor['unit']} × {factor['co2e_per_unit']} kgCO2e/{factor['unit']} = {round(co2e_kg, 4)} kgCO2e"
    }

def get_period_summary(activity_records: list) -> dict:
    """
    彙總一個盤查期間的所有排放量
    """
    scope1_kg = 0
    scope2_kg = 0
    scope3_kg = 0
    unclassified_kg = 0
    sources = []

    for record in activity_records:
        if record.co2e_kg is None:
            continue
        
        # 根據 scope 分組
        s = record.scope
        if s == 1:
            scope1_kg += record.co2e_kg
        elif s == 2:
            scope2_kg += record.co2e_kg
        elif s == 3:
            scope3_kg += record.co2e_kg
        else:
            unclassified_kg += record.co2e_kg

        sources.append({
            "month": record.month,
            "source_type": record.source_type,
            "amount": record.amount,
            "unit": record.unit,
            "co2e_kg": record.co2e_kg,
            "co2e_tonnes": record.co2e_tonnes,
            "scope": s
        })

    total_kg = scope1_kg + scope2_kg + scope3_kg + unclassified_kg
    return {
        "scope1_kg": round(scope1_kg, 4),
        "scope1_tonnes": round(scope1_kg / 1000, 6),
        "scope2_kg": round(scope2_kg, 4),
        "scope2_tonnes": round(scope2_kg / 1000, 6),
        "scope3_kg": round(scope3_kg, 4),
        "scope3_tonnes": round(scope3_kg / 1000, 6),
        "unclassified_kg": round(unclassified_kg, 4),
        "unclassified_tonnes": round(unclassified_kg / 1000, 6),
        "total_kg": round(total_kg, 4),
        "total_tonnes": round(total_kg / 1000, 6),
        "scope_breakdown": {
            "scope1": round(scope1_kg / 1000, 6),
            "scope2": round(scope2_kg / 1000, 6),
            "scope3": round(scope3_kg / 1000, 6),
            "unclassified": round(unclassified_kg / 1000, 6)
        },
        "sources": sources
    }

def list_factors() -> list:
    """列出所有支援的排放源"""
    return [
        {
            "key": k,
            "name": v["name"],
            "unit": v["unit"],
            "co2e_per_unit": v["co2e_per_unit"],
            "scope": v["scope"]
        }
        for k, v in FACTORS.items()
    ]
