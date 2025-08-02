from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database.database import get_db
from app.models.order import Order, OrderItem
from app.models.menu_item import MenuItem
from app.models.table import Table
from app.models.employee import Employee
from app.models.user import User
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/api/orders", tags=["Orders"])

def generate_order_number():
    return f"ORD{datetime.now().strftime('%Y%m%d%H%M%S')}"

@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    table_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    
    if status:
        query = query.filter(Order.status == status)
    
    if table_id:
        query = query.filter(Order.table_id == table_id)
    
    orders = query.offset(skip).limit(limit).all()
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return order

@router.post("/", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if table exists and is available
    table = db.query(Table).filter(Table.id == order_data.table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    if table.status != "available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Table is not available"
        )
    
    # Get employee from current user
    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user is not associated with an employee"
        )
    
    # Create order
    order = Order(
        order_number=generate_order_number(),
        table_id=order_data.table_id,
        employee_id=employee.id,
        notes=order_data.notes
    )
    
    db.add(order)
    db.flush()
    
    # Create order items
    total_amount = 0
    for item_data in order_data.order_items:
        menu_item = db.query(MenuItem).filter(MenuItem.id == item_data.menu_item_id).first()
        if not menu_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Menu item {item_data.menu_item_id} not found"
            )
        
        if not menu_item.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Menu item {menu_item.name} is not available"
            )
        
        order_item = OrderItem(
            order_id=order.id,
            menu_item_id=item_data.menu_item_id,
            quantity=item_data.quantity,
            price=menu_item.price,
            notes=item_data.notes
        )
        
        db.add(order_item)
        total_amount += menu_item.price * item_data.quantity
    
    # Update order total and table status
    order.total_amount = total_amount
    table.status = "occupied"
    
    db.commit()
    db.refresh(order)
    
    return order

@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: int,
    order_update: OrderUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    update_data = order_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)
    
    # If order is completed, update table status
    if order.status == "completed":
        table = db.query(Table).filter(Table.id == order.table_id).first()
        if table:
            table.status = "available"
    
    db.commit()
    db.refresh(order)
    
    return order

@router.delete("/{order_id}")
async def delete_order(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Update table status if needed
    if order.status in ["pending", "preparing", "ready", "served"]:
        table = db.query(Table).filter(Table.id == order.table_id).first()
        if table:
            table.status = "available"
    
    db.delete(order)
    db.commit()
    
    return {"detail": "Order deleted successfully"}

@router.patch("/{order_id}/items/{item_id}/status")
async def update_order_item_status(
    order_id: int,
    item_id: int,
    status: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if status not in ["pending", "preparing", "ready", "served"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status"
        )
    
    order_item = db.query(OrderItem).filter(
        OrderItem.order_id == order_id,
        OrderItem.id == item_id
    ).first()
    
    if not order_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order item not found"
        )
    
    order_item.status = status
    db.commit()
    
    return {"detail": "Order item status updated successfully"}