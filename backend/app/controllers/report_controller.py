from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, date, timedelta
from typing import Optional

from database.database import get_db
from app.models.bill import Bill
from app.models.order import Order
from app.models.user import User
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/revenue/daily")
async def get_daily_revenue(
    date: Optional[date] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    target_date = date or datetime.now().date()
    
    # Get paid bills for the day
    bills = db.query(Bill).filter(
        func.date(Bill.created_at) == target_date,
        Bill.payment_status == "paid"
    ).all()
    
    total_revenue = sum(bill.total_amount for bill in bills)
    total_orders = len(bills)
    
    # Get revenue by payment method
    revenue_by_payment = {}
    for bill in bills:
        payment_method = bill.payment_method or "unknown"
        if payment_method not in revenue_by_payment:
            revenue_by_payment[payment_method] = 0
        revenue_by_payment[payment_method] += bill.total_amount
    
    return {
        "date": target_date,
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "revenue_by_payment_method": revenue_by_payment,
        "bills": bills
    }

@router.get("/revenue/monthly")
async def get_monthly_revenue(
    year: int,
    month: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Get paid bills for the month
    bills = db.query(Bill).filter(
        extract('year', Bill.created_at) == year,
        extract('month', Bill.created_at) == month,
        Bill.payment_status == "paid"
    ).all()
    
    total_revenue = sum(bill.total_amount for bill in bills)
    total_orders = len(bills)
    
    # Group by day
    daily_revenue = {}
    for bill in bills:
        day = bill.created_at.date()
        if day not in daily_revenue:
            daily_revenue[day] = {"revenue": 0, "orders": 0}
        daily_revenue[day]["revenue"] += bill.total_amount
        daily_revenue[day]["orders"] += 1
    
    return {
        "year": year,
        "month": month,
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "daily_breakdown": [
            {
                "date": day,
                "revenue": data["revenue"],
                "orders": data["orders"]
            }
            for day, data in sorted(daily_revenue.items())
        ]
    }

@router.get("/revenue/range")
async def get_revenue_by_range(
    start_date: date,
    end_date: date,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before end date"
        )
    
    # Get paid bills in range
    bills = db.query(Bill).filter(
        func.date(Bill.created_at) >= start_date,
        func.date(Bill.created_at) <= end_date,
        Bill.payment_status == "paid"
    ).all()
    
    total_revenue = sum(bill.total_amount for bill in bills)
    total_orders = len(bills)
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "average_order_value": total_revenue / total_orders if total_orders > 0 else 0
    }

@router.get("/bestsellers")
async def get_bestselling_items(
    days: int = 30,
    limit: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    start_date = datetime.now() - timedelta(days=days)
    
    # Query to get most ordered items
    result = db.query(
        Order.menu_item_id,
        func.sum(Order.quantity).label("total_quantity"),
        func.sum(Order.quantity * Order.price).label("total_revenue")
    ).join(
        Order, Order.id == Order.order_id
    ).filter(
        Order.created_at >= start_date
    ).group_by(
        Order.menu_item_id
    ).order_by(
        func.sum(Order.quantity).desc()
    ).limit(limit).all()
    
    return {
        "period_days": days,
        "bestsellers": [
            {
                "menu_item_id": item[0],
                "total_quantity": item[1],
                "total_revenue": item[2]
            }
            for item in result
        ]
    }