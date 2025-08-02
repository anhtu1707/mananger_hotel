from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.employee import Employee, EmployeePosition
from datetime import datetime
from typing import Optional

class EmployeeController:
    @staticmethod
    def create_employee(db: Session, employee_code: str, full_name: str, position: str,
                       phone: str = None, email: str = None, address: str = None,
                       salary: float = None, user_id: int = None):
        # Check if employee code already exists
        existing_employee = db.query(Employee).filter(Employee.employee_code == employee_code).first()
        if existing_employee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee code already exists"
            )
        
        try:
            position_enum = EmployeePosition(position)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid position. Must be one of: {[p.value for p in EmployeePosition]}"
            )
        
        employee = Employee(
            employee_code=employee_code,
            full_name=full_name,
            phone=phone,
            email=email,
            address=address,
            position=position_enum,
            salary=salary,
            hire_date=datetime.now(),
            user_id=user_id
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)
        return employee

    @staticmethod
    def get_employees(db: Session, skip: int = 0, limit: int = 100, 
                     position: Optional[str] = None, active_only: bool = False):
        query = db.query(Employee)
        
        if position:
            try:
                position_enum = EmployeePosition(position)
                query = query.filter(Employee.position == position_enum)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid position. Must be one of: {[p.value for p in EmployeePosition]}"
                )
        
        if active_only:
            query = query.filter(Employee.is_active == True)
        
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_employee_by_id(db: Session, employee_id: int):
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        return employee

    @staticmethod
    def get_employee_by_code(db: Session, employee_code: str):
        employee = db.query(Employee).filter(Employee.employee_code == employee_code).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        return employee

    @staticmethod
    def update_employee(db: Session, employee_id: int, **kwargs):
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        for key, value in kwargs.items():
            if hasattr(employee, key) and value is not None:
                if key == "position":
                    try:
                        setattr(employee, key, EmployeePosition(value))
                    except ValueError:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Invalid position. Must be one of: {[p.value for p in EmployeePosition]}"
                        )
                elif key == "employee_code":
                    # Check if new employee code already exists
                    existing = db.query(Employee).filter(
                        Employee.employee_code == value,
                        Employee.id != employee_id
                    ).first()
                    if existing:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Employee code already exists"
                        )
                    setattr(employee, key, value)
                else:
                    setattr(employee, key, value)
        
        db.commit()
        db.refresh(employee)
        return employee

    @staticmethod
    def delete_employee(db: Session, employee_id: int):
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        db.delete(employee)
        db.commit()
        return {"message": "Employee deleted successfully"}

    @staticmethod
    def toggle_employee_status(db: Session, employee_id: int):
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        employee.is_active = not employee.is_active
        db.commit()
        db.refresh(employee)
        return employee

    @staticmethod
    def get_positions(db: Session):
        return [{"value": position.value, "label": position.value.replace("_", " ").title()} 
                for position in EmployeePosition]