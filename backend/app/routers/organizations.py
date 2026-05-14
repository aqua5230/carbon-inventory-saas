from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models import Organization, Facility, InventoryPeriod, ActivityData, User
from ..auth_utils import get_current_user

router = APIRouter(prefix="/api", tags=["organizations"])

class OrgCreate(BaseModel):
    name: str
    tax_id: Optional[str] = None
    industry_type: Optional[str] = None
    contact_email: Optional[str] = None

class FacilityCreate(BaseModel):
    name: str
    address: Optional[str] = None

class PeriodCreate(BaseModel):
    year: int

class PeriodStatusUpdate(BaseModel):
    status: str

@router.post("/organizations")
def create_org(data: OrgCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    org = Organization(**data.model_dump(), owner_id=current_user.id)
    db.add(org)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="統一編號已存在")
    db.refresh(org)
    return {"id": org.id, "name": org.name}

@router.get("/organizations")
def list_orgs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    orgs = db.query(Organization).filter(Organization.owner_id == current_user.id).all()
    return [{"id": o.id, "name": o.name, "tax_id": o.tax_id} for o in orgs]

@router.get("/organizations/{org_id}/summary")
def get_org_summary(org_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    org = db.query(Organization).filter(Organization.id == org_id, Organization.owner_id == current_user.id).first()
    if not org:
        raise HTTPException(404, "找不到該組織")

    facilities = db.query(Facility).filter(Facility.org_id == org_id).all()
    facility_ids = [facility.id for facility in facilities]
    facility_count = len(facilities)

    if not facility_ids:
        return {
            "scope1_tonnes": 0.0,
            "scope2_tonnes": 0.0,
            "scope3_tonnes": 0.0,
            "total_tonnes": 0.0,
            "facility_count": 0,
            "period_count": 0,
        }

    periods = db.query(InventoryPeriod).filter(InventoryPeriod.facility_id.in_(facility_ids)).all()
    period_ids = [period.id for period in periods]

    if not period_ids:
        return {
            "scope1_tonnes": 0.0,
            "scope2_tonnes": 0.0,
            "scope3_tonnes": 0.0,
            "total_tonnes": 0.0,
            "facility_count": facility_count,
            "period_count": len(periods),
        }

    records = db.query(ActivityData).filter(ActivityData.period_id.in_(period_ids)).all()

    total_scope1 = sum((record.co2e_kg or 0) for record in records if record.scope == 1) / 1000
    total_scope2 = sum((record.co2e_kg or 0) for record in records if record.scope == 2) / 1000
    total_scope3 = sum((record.co2e_kg or 0) for record in records if record.scope == 3) / 1000
    total = total_scope1 + total_scope2 + total_scope3

    return {
        "scope1_tonnes": total_scope1,
        "scope2_tonnes": total_scope2,
        "scope3_tonnes": total_scope3,
        "total_tonnes": total,
        "facility_count": facility_count,
        "period_count": len(periods),
    }

@router.post("/organizations/{org_id}/facilities")
def create_facility(org_id: int, data: FacilityCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    org = db.query(Organization).filter(Organization.id == org_id, Organization.owner_id == current_user.id).first()
    if not org:
        raise HTTPException(404, "找不到該組織")
    facility = Facility(org_id=org_id, **data.model_dump())
    db.add(facility)
    db.commit()
    db.refresh(facility)
    return {"id": facility.id, "name": facility.name}

@router.get("/organizations/{org_id}/facilities")
def list_facilities(org_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    org = db.query(Organization).filter(Organization.id == org_id, Organization.owner_id == current_user.id).first()
    if not org:
        raise HTTPException(404, "找不到該組織")
    facilities = db.query(Facility).filter(Facility.org_id == org_id).all()
    return [{"id": f.id, "name": f.name, "address": f.address} for f in facilities]

@router.post("/facilities/{facility_id}/periods")
def create_period(facility_id: int, data: PeriodCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    facility = db.query(Facility).join(Organization).filter(Facility.id == facility_id, Organization.owner_id == current_user.id).first()
    if not facility:
        raise HTTPException(404, "找不到該廠區")
    period = InventoryPeriod(facility_id=facility_id, year=data.year)
    db.add(period)
    db.commit()
    db.refresh(period)
    return {"id": period.id, "year": period.year, "status": period.status}

@router.get("/facilities/{facility_id}/periods")
def list_periods(facility_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    facility = db.query(Facility).join(Organization).filter(Facility.id == facility_id, Organization.owner_id == current_user.id).first()
    if not facility:
        raise HTTPException(404, "找不到該廠區")
    periods = db.query(InventoryPeriod).filter(InventoryPeriod.facility_id == facility_id).all()
    return [{"id": p.id, "year": p.year, "status": p.status} for p in periods]

@router.patch("/periods/{period_id}/status")
def update_period_status(period_id: int, data: PeriodStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.status not in {"draft", "submitted"}:
        raise HTTPException(status_code=400, detail="status 僅允許 draft 或 submitted")

    period = (
        db.query(InventoryPeriod)
        .join(Facility, InventoryPeriod.facility_id == Facility.id)
        .join(Organization, Facility.org_id == Organization.id)
        .filter(InventoryPeriod.id == period_id, Organization.owner_id == current_user.id)
        .first()
    )
    if not period:
        raise HTTPException(404, "找不到該盤查期間")

    period.status = data.status
    db.commit()
    db.refresh(period)
    return {"id": period.id, "status": period.status}
