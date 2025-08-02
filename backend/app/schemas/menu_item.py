from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = None
    image_url: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None

class MenuItemResponse(MenuItemBase):
    id: int
    is_available: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True