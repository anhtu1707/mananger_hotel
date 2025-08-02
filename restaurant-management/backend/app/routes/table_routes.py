from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.database.database import get_db
from app.controllers.table_controller import TableController
from app.auth.jwt_handler import get_current_user, get_admin_user
from app.models.user import User
from app.models.table import TableStatus

router = APIRouter(prefix="/tables", tags=["Table Management"])

class TableCreate(BaseModel):
    table_number: int
    capacity: int
    location: Optional[str] = None
    notes: Optional[str] = None

class TableUpdate(BaseModel):
    table_number: Optional[int] = None
    capacity: Optional[int] = None
    status: Optional[TableStatus] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class TableResponse(BaseModel):
    id: int
    table_number: int
    capacity: int
    status: str
    location: Optional[str]
    notes: Optional[str]
    
    class Config:
        from_attributes = True

@router.post("/", response_model=TableResponse)
async def create_table(table: TableCreate, db: Session = Depends(get_db),
                      current_user: User = Depends(get_admin_user)):
    return TableController.create_table(
        db=db, table_number=table.table_number, capacity=table.capacity,
        location=table.location, notes=table.notes
    )

@router.get("/", response_model=List[TableResponse])
async def get_tables(skip: int = 0, limit: int = 100, 
                    status: Optional[str] = Query(None),
                    location: Optional[str] = Query(None),
                    db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    return TableController.get_tables(db, skip=skip, limit=limit, status=status, location=location)

@router.get("/available", response_model=List[TableResponse])
async def get_available_tables(db: Session = Depends(get_db),
                              current_user: User = Depends(get_current_user)):
    return TableController.get_available_tables(db)

@router.get("/{table_id}", response_model=TableResponse)
async def get_table(table_id: int, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    return TableController.get_table_by_id(db, table_id)

@router.put("/{table_id}", response_model=TableResponse)
async def update_table(table_id: int, table_update: TableUpdate,
                      db: Session = Depends(get_db),
                      current_user: User = Depends(get_admin_user)):
    update_data = table_update.dict(exclude_unset=True)
    if 'status' in update_data and update_data['status']:
        update_data['status'] = update_data['status'].value
    return TableController.update_table(db, table_id, **update_data)

@router.delete("/{table_id}")
async def delete_table(table_id: int, db: Session = Depends(get_db),
                      current_user: User = Depends(get_admin_user)):
    return TableController.delete_table(db, table_id)

@router.patch("/{table_id}/status", response_model=TableResponse)
async def update_table_status(table_id: int, status: TableStatus,
                             db: Session = Depends(get_db),
                             current_user: User = Depends(get_current_user)):
    return TableController.update_table_status(db, table_id, status.value)

@router.get("/data/statuses")
async def get_table_statuses(db: Session = Depends(get_db),
                            current_user: User = Depends(get_current_user)):
    return TableController.get_table_statuses(db)

@router.get("/data/locations")
async def get_locations(db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    return TableController.get_locations(db)