from sqlalchemy.orm import Session

from ..models import ActivityData, Facility, InventoryPeriod, Organization


def get_org_summary(db: Session, org: Organization) -> dict:
    facilities = db.query(Facility).filter(Facility.org_id == org.id).all()
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
