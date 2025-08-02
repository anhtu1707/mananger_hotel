from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.database.database import get_db
from app.controllers.menu_controller import MenuController
from app.auth.jwt_handler import get_current_user, get_admin_user
from app.models.user import User
from app.models.menu import MenuCategory

router = APIRouter(prefix="/menu", tags=["Menu Management"])

# Pydantic models
class MenuItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: MenuCategory
    image_url: Optional[str] = None
    preparation_time: Optional[int] = None
    ingredients: Optional[str] = None

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[MenuCategory] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None
    preparation_time: Optional[int] = None
    ingredients: Optional[str] = None

class MenuItemResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    category: str
    image_url: Optional[str]
    is_available: bool
    preparation_time: Optional[int]
    ingredients: Optional[str]
    
    class Config:
        from_attributes = True

@router.post("/items", response_model=MenuItemResponse)
async def create_menu_item(item: MenuItemCreate, db: Session = Depends(get_db),
                          current_user: User = Depends(get_admin_user)):
    """Create a new menu item (admin only)"""
    return MenuController.create_menu_item(
        db=db,
        name=item.name,
        price=item.price,
        category=item.category.value,
        description=item.description,
        image_url=item.image_url,
        preparation_time=item.preparation_time,
        ingredients=item.ingredients
    )

@router.get("/items", response_model=List[MenuItemResponse])
async def get_menu_items(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = Query(None),
    available_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all menu items with optional filters"""
    return MenuController.get_menu_items(
        db, skip=skip, limit=limit, category=category, available_only=available_only
    )

@router.get("/items/{item_id}", response_model=MenuItemResponse)
async def get_menu_item(item_id: int, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    """Get menu item by ID"""
    return MenuController.get_menu_item_by_id(db, item_id)

@router.put("/items/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(item_id: int, item_update: MenuItemUpdate,
                          db: Session = Depends(get_db),
                          current_user: User = Depends(get_admin_user)):
    """Update menu item (admin only)"""
    update_data = item_update.dict(exclude_unset=True)
    if 'category' in update_data and update_data['category']:
        update_data['category'] = update_data['category'].value
    return MenuController.update_menu_item(db, item_id, **update_data)

@router.delete("/items/{item_id}")
async def delete_menu_item(item_id: int, db: Session = Depends(get_db),
                          current_user: User = Depends(get_admin_user)):
    """Delete menu item (admin only)"""
    return MenuController.delete_menu_item(db, item_id)

@router.patch("/items/{item_id}/toggle-availability", response_model=MenuItemResponse)
async def toggle_menu_item_availability(item_id: int, db: Session = Depends(get_db),
                                       current_user: User = Depends(get_admin_user)):
    """Toggle menu item availability (admin only)"""
    return MenuController.toggle_availability(db, item_id)

@router.get("/categories")
async def get_categories(db: Session = Depends(get_db),
                        current_user: User = Depends(get_current_user)):
    """Get all menu categories"""
    return MenuController.get_categories(db)