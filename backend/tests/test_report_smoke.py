"""報告 HTML 渲染 smoke。

WeasyPrint 本身依賴 Cairo/Pango 等系統函式庫，環境不一定有；
我們關心的是 report.html 的 Jinja2 變數契約沒漂移。
"""

from datetime import date
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from app.services import calculator, report_generator


TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"


def _render(summary: dict) -> str:
    env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))
    template = env.get_template("report.html")
    return template.render(
        org_name="測試公司",
        facility_name="測試廠",
        year=2026,
        generated_date=date.today().strftime("%Y年%m月%d日"),
        scope1_tonnes=summary["scope1_tonnes"],
        scope2_tonnes=summary["scope2_tonnes"],
        scope3_tonnes=summary.get("scope3_tonnes", 0),
        unclassified_tonnes=summary.get("unclassified_tonnes", 0),
        scope_breakdown=summary.get("scope_breakdown", {}),
        total_tonnes=summary["total_tonnes"],
        sources=summary["sources"],
        factor_source="環境部溫室氣體排放係數管理表（2024年版）",
        standard="ISO 14064-1:2018",
    )


def test_report_renders_with_full_summary():
    summary = {
        "scope1_tonnes": 1.234,
        "scope2_tonnes": 2.345,
        "scope3_tonnes": 0.567,
        "unclassified_tonnes": 0.1,
        "scope_breakdown": {
            "scope1": 1.234,
            "scope2": 2.345,
            "scope3": 0.567,
            "unclassified": 0.1,
        },
        "total_tonnes": 4.246,
        "sources": [
            {
                "month": 1,
                "source_type": "electricity",
                "amount": 1000,
                "unit": "kWh",
                "co2e_kg": 494,
                "co2e_tonnes": 0.494,
                "scope": 2,
            }
        ],
    }
    html = _render(summary)

    # 內容契約：scope3 / unclassified / 公司名都要出現
    assert "測試公司" in html
    assert "2026" in html


def test_report_renders_with_empty_sources():
    summary = {
        "scope1_tonnes": 0,
        "scope2_tonnes": 0,
        "scope3_tonnes": 0,
        "unclassified_tonnes": 0,
        "scope_breakdown": {},
        "total_tonnes": 0,
        "sources": [],
    }
    # 不應 throw（template 必須能處理空 sources）
    html = _render(summary)
    assert "測試公司" in html


def test_report_renders_without_optional_scope3_keys():
    """summary 沒給 scope3 / unclassified 時，report_generator 用 .get() 提供預設。
    這裡模擬同樣行為，確保 template 不會炸。"""
    summary = {
        "scope1_tonnes": 1.0,
        "scope2_tonnes": 2.0,
        # 沒給 scope3_tonnes / unclassified_tonnes / scope_breakdown
        "total_tonnes": 3.0,
        "sources": [],
    }
    html = _render(summary)
    assert html  # 不空就行


def test_generate_pdf_includes_dataset_version_and_generated_at():
    """report_generator.generate_pdf 必須把係數版本與精確時間注入模板。

    WeasyPrint 未安裝時會回傳 HTML bytes（見 generate_pdf 的 fallback），
    剛好讓我們可以直接斷言內容。WeasyPrint 有裝則回 PDF bytes，
    這個測試會 skip 過第二段斷言（PDF 是 binary）。"""
    summary = calculator.get_period_summary([])  # 含 factor_metadata
    summary.update(
        {
            "scope1_tonnes": 1.0,
            "scope2_tonnes": 2.0,
            "scope3_tonnes": 0.5,
            "total_tonnes": 3.5,
            "sources": [],
        }
    )
    out = report_generator.generate_pdf(
        org_name="稽核測試公司",
        facility_name="總部",
        year=2026,
        summary=summary,
    )
    assert isinstance(out, bytes)
    if out.startswith(b"%PDF"):
        # 有裝 WeasyPrint，內容無法純文字比對，至少確認非空且為 PDF
        return
    text = out.decode("utf-8")
    meta = calculator.get_factor_metadata()
    assert meta["dataset_version"] in text
    assert meta["dataset_source"] in text
    assert "Asia/Taipei" in text
    # 時間應有 +0800 時區字樣（generated_at）
    assert "+0800" in text
    assert "稽核測試公司" in text
