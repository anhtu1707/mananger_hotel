from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.database import Base
import enum

class EmployeePosition(enum.Enum):
    WAITER = "waiter"
    CHEF = "chef"
    CASHIER = "cashier"
    MANAGER = "manager"
    CLEANER = "cleaner"
    BARTENDER = "bartender"

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String(20), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    email = Column(String(100))
    address = Column(String(255))
    position = Column(Enum(EmployeePosition), nullable=False)
    salary = Column(Float)
    hire_date = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    user = relationship("User", backref="employee")