from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from app.database.database import get_db
from app.controllers.order_controller import OrderController
from app.auth.jwt_handler import get_current_user, get_admin_user
from app.models.user import User
from app.models.order import OrderStatus

router = APIRouter(prefix="/orders", tags=["Order Management"])

class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int
    special_instructions: Optional[str] = None

class OrderCreate(BaseModel):
    table_id: int
    employee_id: int
    order_items: List[OrderItemCreate]
    notes: Optional[str] = None

class OrderResponse(BaseModel):
    id: int
    order_number: str
    table_id: int
    employee_id: int
    status: str
    total_amount: float
    tax_amount: float
    discount_amount: float
    final_amount: float
    notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    menu_item_id: int
    quantity: int
    unit_price: float
    total_price: float
    special_instructions: Optional[str]
    
    class Config:
        from_attributes = True

class StatusUpdate(BaseModel):
    status: OrderStatus

class DiscountApply(BaseModel):
    discount_amount: float

@router.post("/", response_model=OrderResponse)
async def create_order(order: OrderCreate, db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    order_items_data = [item.dict() for item in order.order_items]
    return OrderController.create_order(
        db=db, table_id=order.table_id, employee_id=order.employee_id,
        order_items=order_items_data, notes=order.notes
    )

@router.get("/", response_model=List[OrderResponse])
async def get_orders(skip: int = 0, limit: int = 100,
                    status: Optional[str] = Query(None),
                    table_id: Optional[int] = Query(None),
                    db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    return OrderController.get_orders(db, skip=skip, limit=limit, status=status, table_id=table_id)

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: int, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    return OrderController.get_order_by_id(db, order_id)

@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(order_id: int, status_update: StatusUpdate,
                             db: Session = Depends(get_db),
                             current_user: User = Depends(get_current_user)):
    return OrderController.update_order_status(db, order_id, status_update.status.value)

@router.post("/{order_id}/items", response_model=OrderItemResponse)
async def add_order_item(order_id: int, item: OrderItemCreate,
                        db: Session = Depends(get_db),
                        current_user: User = Depends(get_current_user)):
    return OrderController.add_order_item(
        db, order_id, item.menu_item_id, item.quantity, item.special_instructions
    )

@router.delete("/items/{order_item_id}")
async def remove_order_item(order_item_id: int, db: Session = Depends(get_db),
                           current_user: User = Depends(get_current_user)):
    return OrderController.remove_order_item(db, order_item_id)

@router.patch("/{order_id}/discount", response_model=OrderResponse)
async def apply_discount(order_id: int, discount: DiscountApply,
                        db: Session = Depends(get_db),
                        current_user: User = Depends(get_current_user)):
    return OrderController.apply_discount(db, order_id, discount.discount_amount)

@router.patch("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(order_id: int, db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    return OrderController.cancel_order(db, order_id)

@router.get("/data/statuses")
async def get_order_statuses(db: Session = Depends(get_db),
                            current_user: User = Depends(get_current_user)):
    return OrderController.get_order_statuses(db)