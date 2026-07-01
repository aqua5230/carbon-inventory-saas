from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime
import enum

class InventoryStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    verified = "verified"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String(200), nullable=False)
    tax_id = Column(String(20), unique=True)
    industry_type = Column(String(100))
    contact_email = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    facilities = relationship("Facility", back_populates="organization")

class Facility(Base):
    __tablename__ = "facilities"
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    address = Column(String(500))
    organization = relationship("Organization", back_populates="facilities")
    periods = relationship("InventoryPeriod", back_populates="facility")

class InventoryPeriod(Base):
    __tablename__ = "inventory_periods"
    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    status = Column(String(20), default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    facility = relationship("Facility", back_populates="periods")
    activity_data = relationship("ActivityData", back_populates="period")

class ActivityData(Base):
    __tablename__ = "activity_data"
    id = Column(Integer, primary_key=True, index=True)
    period_id = Column(Integer, ForeignKey("inventory_periods.id"), nullable=False, index=True)
    month = Column(Integer, nullable=False)  # 1-12
    source_type = Column(String(50), nullable=False)  # electricity, diesel, etc.
    amount = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    # 計算結果
    co2e_kg = Column(Float)           # 公斤 CO2e
    co2e_tonnes = Column(Float)       # 公噸 CO2e
    factor_value = Column(Float)      # 使用的排放係數
    factor_source = Column(String(200))
    scope = Column(Integer)           # 1, 2, or 3
    evidence_url = Column(String(500))  # 電費單圖片
    note = Column(Text)
    period = relationship("InventoryPeriod", back_populates="activity_data")
