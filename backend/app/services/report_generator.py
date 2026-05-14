from jinja2 import Environment, FileSystemLoader
from pathlib import Path
from datetime import date

TEMPLATE_DIR = Path(__file__).parent.parent.parent / "templates"

def generate_pdf(org_name: str, facility_name: str, year: int, summary: dict) -> bytes:
    """產生 PDF 報告"""
    env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))
    template = env.get_template("report.html")

    html_content = template.render(
        org_name=org_name,
        facility_name=facility_name,
        year=year,
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

    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html_content, base_url=str(TEMPLATE_DIR)).write_pdf()
        return pdf_bytes
    except ImportError:
        # WeasyPrint 未安裝時，回傳 HTML 作為備用
        return html_content.encode("utf-8")
