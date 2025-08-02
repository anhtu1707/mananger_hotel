from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database.database import Base

class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(String(10), unique=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    location = Column(String(50))  # indoor, outdoor, vip
    status = Column(String(20), default="available")  # available, occupied, reserved
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())