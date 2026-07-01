"""Excel parser 測試：模板來回 + 錯誤行不應整批失敗。"""

from io import BytesIO

import pandas as pd
import pytest

from app.services.excel_parser import COLUMN_ALIASES, get_template_bytes, parse_excel


def _make_xlsx(df: pd.DataFrame) -> bytes:
    buf = BytesIO()
    df.to_excel(buf, index=False, sheet_name="活動數據")
    buf.seek(0)
    return buf.read()


def test_template_columns_all_recognised():
    """template 產出的每個欄位都要在 COLUMN_ALIASES 內，避免別名清單漂移。"""
    template = pd.read_excel(BytesIO(get_template_bytes()))
    all_aliases = {a for aliases in COLUMN_ALIASES.values() for a in aliases}
    for col in template.columns:
        assert col in all_aliases, f"模板欄位 {col} 不在 COLUMN_ALIASES，會被靜默忽略"


def test_parse_valid_template_with_data():
    df = pd.DataFrame(
        {
            "月份": [1, 2],
            "用電度數(kWh)": [1000, 2000],
            "柴油(公升)": [50, None],
        }
    )
    result = parse_excel(_make_xlsx(df))
    assert result["errors"] == []
    types = {(r["month"], r["source_type"]): r["amount"] for r in result["data"]}
    assert types[(1, "electricity")] == 1000
    assert types[(2, "electricity")] == 2000
    assert types[(1, "diesel")] == 50
    # None 不應產出 record
    assert (2, "diesel") not in types


def test_missing_month_column_raises():
    df = pd.DataFrame({"用電度數(kWh)": [100]})
    with pytest.raises(ValueError, match="找不到「月份」欄位"):
        parse_excel(_make_xlsx(df))


def test_invalid_month_value_is_recorded_not_fatal():
    df = pd.DataFrame(
        {
            "月份": [1, 13, "Jan", 12],
            "用電度數(kWh)": [100, 200, 300, 400],
        }
    )
    result = parse_excel(_make_xlsx(df))
    # 月份 1 與 12 是合法，其他兩列進 errors
    valid_months = {r["month"] for r in result["data"]}
    assert valid_months == {1, 12}
    assert len(result["errors"]) == 2
    error_msgs = [e["error"] for e in result["errors"]]
    assert any("13" in m for m in error_msgs)
    assert any("Jan" in m for m in error_msgs)


def test_blank_month_row_skipped_silently():
    df = pd.DataFrame({"月份": [1, None, 2], "用電度數(kWh)": [100, 200, 300]})
    result = parse_excel(_make_xlsx(df))
    assert result["errors"] == []
    months = sorted(r["month"] for r in result["data"])
    assert months == [1, 2]


def test_invalid_amount_recorded_as_error_not_fatal():
    df = pd.DataFrame(
        {
            "月份": [1, 2],
            "用電度數(kWh)": ["bad", 500],
        }
    )
    result = parse_excel(_make_xlsx(df))
    # 2 月的合法值仍要保留
    assert any(r["month"] == 2 and r["amount"] == 500 for r in result["data"])
    assert len(result["errors"]) == 1
    assert "electricity" in result["errors"][0]["error"]
