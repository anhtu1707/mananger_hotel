from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String(20), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    email = Column(String(100))
    address = Column(String(255))
    date_of_birth = Column(Date)
    position = Column(String(50))  # waiter, chef, cashier, manager
    salary = Column(Float)
    start_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", backref="employee")