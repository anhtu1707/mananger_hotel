from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database.database import get_db
from app.models.menu_item import MenuItem
from app.models.user import User
from app.schemas.menu_item import MenuItemCreate, MenuItemUpdate, MenuItemResponse
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/api/menu", tags=["Menu"])

@router.get("/", response_model=List[MenuItemResponse])
async def get_menu_items(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    is_available: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MenuItem)
    
    if category:
        query = query.filter(MenuItem.category == category)
    
    if is_available is not None:
        query = query.filter(MenuItem.is_available == is_available)
    
    menu_items = query.offset(skip).limit(limit).all()
    return menu_items

@router.get("/{item_id}", response_model=MenuItemResponse)
async def get_menu_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    menu_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not menu_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    return menu_item

@router.post("/", response_model=MenuItemResponse)
async def create_menu_item(
    item_data: MenuItemCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    menu_item = MenuItem(**item_data.dict())
    db.add(menu_item)
    db.commit()
    db.refresh(menu_item)
    
    return menu_item

@router.put("/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    item_id: int,
    item_update: MenuItemUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    menu_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not menu_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    
    update_data = item_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(menu_item, field, value)
    
    db.commit()
    db.refresh(menu_item)
    
    return menu_item

@router.delete("/{item_id}")
async def delete_menu_item(
    item_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    menu_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not menu_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    
    db.delete(menu_item)
    db.commit()
    
    return {"detail": "Menu item deleted successfully"}