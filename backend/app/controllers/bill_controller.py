from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database.database import get_db
from app.models.bill import Bill
from app.models.order import Order
from app.models.user import User
from app.schemas.bill import BillCreate, BillUpdate, BillResponse
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/api/bills", tags=["Bills"])

def generate_bill_number():
    return f"BILL{datetime.now().strftime('%Y%m%d%H%M%S')}"

@router.get("/", response_model=List[BillResponse])
async def get_bills(
    skip: int = 0,
    limit: int = 100,
    payment_status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Bill)
    
    if payment_status:
        query = query.filter(Bill.payment_status == payment_status)
    
    bills = query.offset(skip).limit(limit).all()
    return bills

@router.get("/{bill_id}", response_model=BillResponse)
async def get_bill(
    bill_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    return bill

@router.post("/", response_model=BillResponse)
async def create_bill(
    bill_data: BillCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if order exists
    order = db.query(Order).filter(Order.id == bill_data.order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if bill already exists for this order
    existing_bill = db.query(Bill).filter(Bill.order_id == bill_data.order_id).first()
    if existing_bill:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bill already exists for this order"
        )
    
    # Calculate amounts
    subtotal = order.total_amount
    tax_rate = 0.1  # 10% tax
    tax_amount = subtotal * tax_rate
    discount_amount = bill_data.discount_amount or 0
    total_amount = subtotal + tax_amount - discount_amount
    
    # Create bill
    bill = Bill(
        bill_number=generate_bill_number(),
        order_id=bill_data.order_id,
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=discount_amount,
        total_amount=total_amount,
        payment_method=bill_data.payment_method,
        notes=bill_data.notes
    )
    
    db.add(bill)
    db.commit()
    db.refresh(bill)
    
    return bill

@router.put("/{bill_id}", response_model=BillResponse)
async def update_bill(
    bill_id: int,
    bill_update: BillUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    update_data = bill_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bill, field, value)
    
    # If bill is paid, update order status
    if bill.payment_status == "paid":
        order = db.query(Order).filter(Order.id == bill.order_id).first()
        if order:
            order.status = "completed"
    
    db.commit()
    db.refresh(bill)
    
    return bill

@router.delete("/{bill_id}")
async def delete_bill(
    bill_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    db.delete(bill)
    db.commit()
    
    return {"detail": "Bill deleted successfully"}

@router.get("/order/{order_id}", response_model=BillResponse)
async def get_bill_by_order(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    bill = db.query(Bill).filter(Bill.order_id == order_id).first()
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found for this order"
        )
    return bill