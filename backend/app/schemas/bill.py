from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BillBase(BaseModel):
    order_id: int
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class BillCreate(BillBase):
    discount_amount: Optional[float] = 0

class BillUpdate(BaseModel):
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None

class BillResponse(BillBase):
    id: int
    bill_number: str
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    payment_status: str
    created_at: datetime

    class Config:
        from_attributes = True