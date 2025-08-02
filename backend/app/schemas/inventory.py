from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InventoryBase(BaseModel):
    item_name: str
    description: Optional[str] = None
    quantity: float
    unit: str
    min_quantity: Optional[float] = 0
    price_per_unit: Optional[float] = None
    supplier: Optional[str] = None
    category: Optional[str] = None

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    item_name: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    min_quantity: Optional[float] = None
    price_per_unit: Optional[float] = None
    supplier: Optional[str] = None
    category: Optional[str] = None

class InventoryResponse(InventoryBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True