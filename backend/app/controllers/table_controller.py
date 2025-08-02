from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database.database import get_db
from app.models.table import Table
from app.models.user import User
from app.schemas.table import TableCreate, TableUpdate, TableResponse
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/api/tables", tags=["Tables"])

@router.get("/", response_model=List[TableResponse])
async def get_tables(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Table)
    
    if status:
        query = query.filter(Table.status == status)
    
    if location:
        query = query.filter(Table.location == location)
    
    tables = query.offset(skip).limit(limit).all()
    return tables

@router.get("/{table_id}", response_model=TableResponse)
async def get_table(
    table_id: int,
    db: Session = Depends(get_db)
):
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    return table

@router.post("/", response_model=TableResponse)
async def create_table(
    table_data: TableCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if table number exists
    if db.query(Table).filter(Table.table_number == table_data.table_number).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Table number already exists"
        )
    
    table = Table(**table_data.dict())
    db.add(table)
    db.commit()
    db.refresh(table)
    
    return table

@router.put("/{table_id}", response_model=TableResponse)
async def update_table(
    table_id: int,
    table_update: TableUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    update_data = table_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(table, field, value)
    
    db.commit()
    db.refresh(table)
    
    return table

@router.delete("/{table_id}")
async def delete_table(
    table_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    db.delete(table)
    db.commit()
    
    return {"detail": "Table deleted successfully"}

@router.patch("/{table_id}/status")
async def update_table_status(
    table_id: int,
    status: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if status not in ["available", "occupied", "reserved"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status"
        )
    
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    table.status = status
    db.commit()
    db.refresh(table)
    
    return table