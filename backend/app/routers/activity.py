from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from io import BytesIO
from ..database import get_db
from ..models import InventoryPeriod, ActivityData, User, Facility, Organization
from ..services import calculator, excel_parser
from ..auth_utils import get_current_user

router = APIRouter(prefix="/api", tags=["activity"])

class ActivityCreate(BaseModel):
    month: int
    source_type: str
    amount: float = Field(gt=0)
    note: Optional[str] = None

@router.get("/factors")
def list_factors(current_user: User = Depends(get_current_user)):
    """列出所有支援的排放源與係數"""
    return calculator.list_factors()

@router.post("/periods/{period_id}/activity")
def add_activity(period_id: int, data: ActivityCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    period = db.query(InventoryPeriod).join(Facility).join(Organization).filter(
        InventoryPeriod.id == period_id, Organization.owner_id == current_user.id
    ).first()
    if not period:
        raise HTTPException(404, "找不到該盤查期間")
    if not (1 <= data.month <= 12):
        raise HTTPException(400, "月份必須在 1-12 之間")

    result = calculator.calculate(data.source_type, data.amount)

    record = ActivityData(
        period_id=period_id,
        month=data.month,
        source_type=data.source_type,
        amount=data.amount,
        unit=result["unit"],
        co2e_kg=result["co2e_kg"],
        co2e_tonnes=result["co2e_tonnes"],
        factor_value=result["factor_value"],
        factor_source=result["factor_source"],
        scope=result["scope"],
        note=data.note
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "month": record.month,
        "source_type": record.source_type,
        "amount": record.amount,
        "unit": record.unit,
        "co2e_kg": record.co2e_kg,
        "co2e_tonnes": record.co2e_tonnes,
        "scope": record.scope,
        "calculation": result["calculation"]
    }

@router.get("/periods/{period_id}/activity")
def list_activity(period_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    period = db.query(InventoryPeriod).join(Facility).join(Organization).filter(
        InventoryPeriod.id == period_id, Organization.owner_id == current_user.id
    ).first()
    if not period:
        raise HTTPException(404, "找不到該盤查期間")
    
    records = db.query(ActivityData).filter(ActivityData.period_id == period_id).order_by(
        ActivityData.month, ActivityData.source_type
    ).all()
    return [
        {
            "id": r.id,
            "month": r.month,
            "source_type": r.source_type,
            "amount": r.amount,
            "unit": r.unit,
            "co2e_kg": r.co2e_kg,
            "co2e_tonnes": r.co2e_tonnes,
            "scope": r.scope,
        }
        for r in records
    ]

@router.delete("/activity/{record_id}")
def delete_activity(record_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.query(ActivityData).join(InventoryPeriod).join(Facility).join(Organization).filter(
        ActivityData.id == record_id, Organization.owner_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(404, "找不到該記錄")
    db.delete(record)
    db.commit()
    return {"message": "已刪除"}

@router.get("/periods/{period_id}/summary")
def get_summary(period_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    period = db.query(InventoryPeriod).join(Facility).join(Organization).filter(
        InventoryPeriod.id == period_id, Organization.owner_id == current_user.id
    ).first()
    if not period:
        raise HTTPException(404, "找不到該盤查期間")
        
    records = db.query(ActivityData).filter(ActivityData.period_id == period_id).all()
    if not records:
        return {
            "scope1_kg": 0,
            "scope1_tonnes": 0,
            "scope2_kg": 0,
            "scope2_tonnes": 0,
            "scope3_kg": 0,
            "scope3_tonnes": 0,
            "unclassified_kg": 0,
            "unclassified_tonnes": 0,
            "total_kg": 0,
            "total_tonnes": 0,
            "scope_breakdown": {
                "scope1": 0,
                "scope2": 0,
                "scope3": 0,
                "unclassified": 0
            },
            "sources": []
        }
    return calculator.get_period_summary(records)

@router.post("/periods/{period_id}/upload-excel")
async def upload_excel(period_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    period = db.query(InventoryPeriod).join(Facility).join(Organization).filter(
        InventoryPeriod.id == period_id, Organization.owner_id == current_user.id
    ).first()
    if not period:
        raise HTTPException(404, "找不到該盤查期間")

    content = await file.read()
    try:
        parsed_result = excel_parser.parse_excel(content)
        records_data = parsed_result["data"]
        parse_errors = parsed_result["errors"]
    except ValueError as e:
        raise HTTPException(400, str(e))

    created = []
    for row in records_data:
        try:
            result = calculator.calculate(row["source_type"], row["amount"])
            record = ActivityData(
                period_id=period_id,
                month=row["month"],
                source_type=row["source_type"],
                amount=row["amount"],
                unit=result["unit"],
                co2e_kg=result["co2e_kg"],
                co2e_tonnes=result["co2e_tonnes"],
                factor_value=result["factor_value"],
                factor_source=result["factor_source"],
                scope=result["scope"],
            )
            db.add(record)
            created.append({"month": row["month"], "source_type": row["source_type"], "co2e_tonnes": result["co2e_tonnes"]})
        except Exception as e:
            parse_errors.append({"row": "DB", "error": f"計算或儲存失敗: {str(e)}"})

    db.commit()
    return {
        "success_count": len(created),
        "error_count": len(parse_errors),
        "errors": parse_errors,
        "imported": len(created) # 為相容舊前端
    }

@router.get("/template/download")
def download_template():
    """下載標準活動數據 Excel 模板"""
    template_bytes = excel_parser.get_template_bytes()
    return StreamingResponse(
        BytesIO(template_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=carbon_template.xlsx"}
    )
