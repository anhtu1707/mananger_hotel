from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database.database import get_db
from app.models.inventory import Inventory
from app.models.user import User
from app.schemas.inventory import InventoryCreate, InventoryUpdate, InventoryResponse
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

@router.get("/", response_model=List[InventoryResponse])
async def get_inventory_items(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    low_stock: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Inventory)
    
    if category:
        query = query.filter(Inventory.category == category)
    
    if low_stock:
        query = query.filter(Inventory.quantity <= Inventory.min_quantity)
    
    items = query.offset(skip).limit(limit).all()
    return items

@router.get("/{item_id}", response_model=InventoryResponse)
async def get_inventory_item(
    item_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    return item

@router.post("/", response_model=InventoryResponse)
async def create_inventory_item(
    item_data: InventoryCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    item = Inventory(**item_data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return item

@router.put("/{item_id}", response_model=InventoryResponse)
async def update_inventory_item(
    item_id: int,
    item_update: InventoryUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    update_data = item_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    db.commit()
    db.refresh(item)
    
    return item

@router.delete("/{item_id}")
async def delete_inventory_item(
    item_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    db.delete(item)
    db.commit()
    
    return {"detail": "Inventory item deleted successfully"}

@router.patch("/{item_id}/quantity")
async def update_inventory_quantity(
    item_id: int,
    quantity_change: float,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    new_quantity = item.quantity + quantity_change
    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient quantity"
        )
    
    item.quantity = new_quantity
    db.commit()
    db.refresh(item)
    
    return item