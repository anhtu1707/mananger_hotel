from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.database.database import get_db
from app.controllers.inventory_controller import InventoryController
from app.auth.jwt_handler import get_current_user, get_admin_user
from app.models.user import User
from app.models.inventory import InventoryUnit

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])

class InventoryItemCreate(BaseModel):
    name: str
    category: Optional[str] = None
    unit: InventoryUnit
    current_stock: float = 0
    minimum_stock: float = 0
    unit_price: Optional[float] = None
    supplier: Optional[str] = None
    expiry_date: Optional[datetime] = None

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[InventoryUnit] = None
    minimum_stock: Optional[float] = None
    unit_price: Optional[float] = None
    supplier: Optional[str] = None
    expiry_date: Optional[datetime] = None

class InventoryItemResponse(BaseModel):
    id: int
    name: str
    category: Optional[str]
    unit: str
    current_stock: float
    minimum_stock: float
    unit_price: Optional[float]
    supplier: Optional[str]
    expiry_date: Optional[datetime]
    last_restocked: Optional[datetime]
    
    class Config:
        from_attributes = True

class StockUpdate(BaseModel):
    quantity: float

@router.post("/", response_model=InventoryItemResponse)
async def create_inventory_item(item: InventoryItemCreate, db: Session = Depends(get_db),
                               current_user: User = Depends(get_admin_user)):
    return InventoryController.create_inventory_item(
        db=db, name=item.name, unit=item.unit.value, category=item.category,
        current_stock=item.current_stock, minimum_stock=item.minimum_stock,
        unit_price=item.unit_price, supplier=item.supplier, expiry_date=item.expiry_date
    )

@router.get("/", response_model=List[InventoryItemResponse])
async def get_inventory_items(skip: int = 0, limit: int = 100,
                             category: Optional[str] = Query(None),
                             low_stock_only: bool = Query(False),
                             db: Session = Depends(get_db),
                             current_user: User = Depends(get_current_user)):
    return InventoryController.get_inventory_items(db, skip=skip, limit=limit, category=category, low_stock_only=low_stock_only)

@router.get("/low-stock", response_model=List[InventoryItemResponse])
async def get_low_stock_items(db: Session = Depends(get_db),
                             current_user: User = Depends(get_current_user)):
    return InventoryController.get_low_stock_items(db)

@router.get("/expired", response_model=List[InventoryItemResponse])
async def get_expired_items(db: Session = Depends(get_db),
                           current_user: User = Depends(get_current_user)):
    return InventoryController.get_expired_items(db)

@router.get("/{item_id}", response_model=InventoryItemResponse)
async def get_inventory_item(item_id: int, db: Session = Depends(get_db),
                            current_user: User = Depends(get_current_user)):
    return InventoryController.get_inventory_item_by_id(db, item_id)

@router.put("/{item_id}", response_model=InventoryItemResponse)
async def update_inventory_item(item_id: int, item_update: InventoryItemUpdate,
                               db: Session = Depends(get_db),
                               current_user: User = Depends(get_admin_user)):
    update_data = item_update.dict(exclude_unset=True)
    if 'unit' in update_data and update_data['unit']:
        update_data['unit'] = update_data['unit'].value
    return InventoryController.update_inventory_item(db, item_id, **update_data)

@router.delete("/{item_id}")
async def delete_inventory_item(item_id: int, db: Session = Depends(get_db),
                               current_user: User = Depends(get_admin_user)):
    return InventoryController.delete_inventory_item(db, item_id)

@router.patch("/{item_id}/restock", response_model=InventoryItemResponse)
async def restock_item(item_id: int, stock_update: StockUpdate,
                      db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    return InventoryController.restock_item(db, item_id, stock_update.quantity)

@router.patch("/{item_id}/consume", response_model=InventoryItemResponse)
async def consume_stock(item_id: int, stock_update: StockUpdate,
                       db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    return InventoryController.consume_stock(db, item_id, stock_update.quantity)

@router.get("/data/units")
async def get_units(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return InventoryController.get_units(db)

@router.get("/data/categories")
async def get_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return InventoryController.get_categories(db)