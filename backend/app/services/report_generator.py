import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from . import calculator

logger = logging.getLogger(__name__)

TEMPLATE_DIR = Path(__file__).parent.parent.parent / "templates"

# 台灣中小企業情境：固定用 Asia/Taipei
_TAIPEI = timezone(timedelta(hours=8))


def _now_taipei() -> datetime:
    return datetime.now(_TAIPEI)


def generate_pdf(org_name: str, facility_name: str, year: int, summary: dict) -> bytes:
    """產生 PDF 報告"""
    env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))
    template = env.get_template("report.html")

    metadata = summary.get("factor_metadata") or calculator.get_factor_metadata()
    now = _now_taipei()
    generated_date = now.strftime("%Y年%m月%d日")
    generated_at = now.strftime("%Y-%m-%d %H:%M:%S %z")

    html_content = template.render(
        org_name=org_name,
        facility_name=facility_name,
        year=year,
        generated_date=generated_date,
        generated_at=generated_at,
        scope1_tonnes=summary["scope1_tonnes"],
        scope2_tonnes=summary["scope2_tonnes"],
        scope3_tonnes=summary.get("scope3_tonnes", 0),
        unclassified_tonnes=summary.get("unclassified_tonnes", 0),
        scope_breakdown=summary.get("scope_breakdown", {}),
        total_tonnes=summary["total_tonnes"],
        sources=summary["sources"],
        dataset_version=metadata["dataset_version"],
        dataset_source=metadata["dataset_source"],
        factors_count=metadata["factors_count"],
        factor_source=metadata["dataset_source"],
        standard=metadata["standard"],
    )

    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html_content, base_url=str(TEMPLATE_DIR)).write_pdf()
        return pdf_bytes
    except (ImportError, OSError) as exc:
        # WeasyPrint 未安裝或系統庫（gobject / pango / cairo）缺失時，
        # 回傳 HTML 作為備用，避免報告生成整體失敗。
        # 必須留下紀錄：否則正式環境會一直發出副檔名為 .pdf 的 HTML 而無人察覺。
        logger.warning("WeasyPrint 無法產生 PDF，改回傳 HTML：%s", exc)
        return html_content.encode("utf-8")
