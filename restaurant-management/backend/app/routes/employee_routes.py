from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.database.database import get_db
from app.controllers.employee_controller import EmployeeController
from app.auth.jwt_handler import get_current_user, get_admin_user
from app.models.user import User
from app.models.employee import EmployeePosition

router = APIRouter(prefix="/employees", tags=["Employee Management"])

class EmployeeCreate(BaseModel):
    employee_code: str
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    position: EmployeePosition
    salary: Optional[float] = None
    user_id: Optional[int] = None

class EmployeeUpdate(BaseModel):
    employee_code: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    position: Optional[EmployeePosition] = None
    salary: Optional[float] = None
    is_active: Optional[bool] = None

class EmployeeResponse(BaseModel):
    id: int
    employee_code: str
    full_name: str
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    position: str
    salary: Optional[float]
    hire_date: Optional[datetime]
    is_active: bool
    
    class Config:
        from_attributes = True

@router.post("/", response_model=EmployeeResponse)
async def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db),
                         current_user: User = Depends(get_admin_user)):
    return EmployeeController.create_employee(
        db=db, employee_code=employee.employee_code, full_name=employee.full_name,
        position=employee.position.value, phone=employee.phone, email=employee.email,
        address=employee.address, salary=employee.salary, user_id=employee.user_id
    )

@router.get("/", response_model=List[EmployeeResponse])
async def get_employees(skip: int = 0, limit: int = 100, position: Optional[str] = Query(None),
                       active_only: bool = Query(False), db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    return EmployeeController.get_employees(db, skip=skip, limit=limit, position=position, active_only=active_only)

@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: int, db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    return EmployeeController.get_employee_by_id(db, employee_id)

@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(employee_id: int, employee_update: EmployeeUpdate,
                         db: Session = Depends(get_db),
                         current_user: User = Depends(get_admin_user)):
    update_data = employee_update.dict(exclude_unset=True)
    if 'position' in update_data and update_data['position']:
        update_data['position'] = update_data['position'].value
    return EmployeeController.update_employee(db, employee_id, **update_data)

@router.delete("/{employee_id}")
async def delete_employee(employee_id: int, db: Session = Depends(get_db),
                         current_user: User = Depends(get_admin_user)):
    return EmployeeController.delete_employee(db, employee_id)

@router.patch("/{employee_id}/toggle-status", response_model=EmployeeResponse)
async def toggle_employee_status(employee_id: int, db: Session = Depends(get_db),
                                current_user: User = Depends(get_admin_user)):
    return EmployeeController.toggle_employee_status(db, employee_id)

@router.get("/data/positions")
async def get_positions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return EmployeeController.get_positions(db)