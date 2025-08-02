from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class OrderItemBase(BaseModel):
    menu_item_id: int
    quantity: int
    notes: Optional[str] = None

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: int
    price: float
    status: str

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    table_id: int
    notes: Optional[str] = None

class OrderCreate(OrderBase):
    order_items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class OrderResponse(OrderBase):
    id: int
    order_number: str
    employee_id: int
    status: str
    total_amount: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    order_items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True