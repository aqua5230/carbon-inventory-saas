from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, HTMLResponse
from sqlalchemy.orm import Session
from io import BytesIO
from ..database import get_db
from ..models import InventoryPeriod, Facility, Organization, ActivityData, User
from ..services import calculator, report_generator
from ..auth_utils import get_current_user

router = APIRouter(prefix="/api", tags=["reports"])

@router.get("/periods/{period_id}/report")
def generate_report(period_id: int, format: str = "pdf", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    period = db.query(InventoryPeriod).join(Facility).join(Organization).filter(
        InventoryPeriod.id == period_id, Organization.owner_id == current_user.id
    ).first()
    if not period:
        raise HTTPException(404, "找不到該盤查期間")

    facility = db.query(Facility).filter(Facility.id == period.facility_id).first()
    org = db.query(Organization).filter(Organization.id == facility.org_id).first()

    records = db.query(ActivityData).filter(ActivityData.period_id == period_id).all()
    if not records:
        raise HTTPException(400, "尚未填寫任何活動數據，無法產生報告")

    summary = calculator.get_period_summary(records)

    content = report_generator.generate_pdf(
        org_name=org.name,
        facility_name=facility.name,
        year=period.year,
        summary=summary
    )

    filename = f"碳盤查報告_{org.name}_{period.year}.pdf"

    if format == "html":
        return HTMLResponse(content=content.decode("utf-8") if isinstance(content, bytes) else content)

    return StreamingResponse(
        BytesIO(content),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"}
    )
