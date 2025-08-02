from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Enum
from sqlalchemy.sql import func
from app.database.database import Base
import enum

class ReportType(enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(Enum(ReportType), nullable=False)
    report_date = Column(Date, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_orders = Column(Integer, default=0)
    total_revenue = Column(Float, default=0)
    total_tax = Column(Float, default=0)
    total_discount = Column(Float, default=0)
    net_revenue = Column(Float, default=0)
    average_order_value = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())