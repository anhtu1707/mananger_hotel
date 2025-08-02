from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date

class EmployeeBase(BaseModel):
    employee_code: str
    full_name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    position: Optional[str] = None
    salary: Optional[float] = None
    start_date: date

class EmployeeCreate(EmployeeBase):
    user_id: Optional[int] = None

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    position: Optional[str] = None
    salary: Optional[float] = None
    is_active: Optional[bool] = None

class EmployeeResponse(EmployeeBase):
    id: int
    is_active: bool
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True