from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from app.database.database import get_db
from app.controllers.report_controller import ReportController
from app.auth.jwt_handler import get_current_user, get_admin_user
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

class ReportResponse(BaseModel):
    id: int
    report_type: str
    report_date: date
    start_date: date
    end_date: date
    total_orders: int
    total_revenue: float
    total_tax: float
    total_discount: float
    net_revenue: float
    average_order_value: float
    
    class Config:
        from_attributes = True

@router.post("/daily", response_model=ReportResponse)
async def generate_daily_report(report_date: Optional[date] = Query(None),
                               db: Session = Depends(get_db),
                               current_user: User = Depends(get_admin_user)):
    """Generate daily revenue report"""
    return ReportController.generate_daily_report(db, report_date)

@router.post("/monthly", response_model=ReportResponse)
async def generate_monthly_report(year: int = Query(...), month: int = Query(...),
                                 db: Session = Depends(get_db),
                                 current_user: User = Depends(get_admin_user)):
    """Generate monthly revenue report"""
    return ReportController.generate_monthly_report(db, year, month)

@router.get("/", response_model=List[ReportResponse])
async def get_reports(report_type: Optional[str] = Query(None),
                     start_date: Optional[date] = Query(None),
                     end_date: Optional[date] = Query(None),
                     skip: int = 0, limit: int = 100,
                     db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    """Get all reports with optional filters"""
    return ReportController.get_reports(db, report_type, start_date, end_date, skip, limit)

@router.get("/revenue-by-period")
async def get_revenue_by_period(start_date: date = Query(...), end_date: date = Query(...),
                               db: Session = Depends(get_db),
                               current_user: User = Depends(get_current_user)):
    """Get revenue data for a specific period"""
    return ReportController.get_revenue_by_period(db, start_date, end_date)

@router.get("/daily-chart")
async def get_daily_revenue_chart(start_date: date = Query(...), end_date: date = Query(...),
                                 db: Session = Depends(get_db),
                                 current_user: User = Depends(get_current_user)):
    """Get daily revenue chart data"""
    return ReportController.get_daily_revenue_chart(db, start_date, end_date)

@router.get("/top-selling-items")
async def get_top_selling_items(start_date: date = Query(...), end_date: date = Query(...),
                               limit: int = Query(10),
                               db: Session = Depends(get_db),
                               current_user: User = Depends(get_current_user)):
    """Get top selling menu items for a period"""
    return ReportController.get_top_selling_items(db, start_date, end_date, limit)

@router.get("/dashboard")
async def get_dashboard_summary(db: Session = Depends(get_db),
                               current_user: User = Depends(get_current_user)):
    """Get dashboard summary with key metrics"""
    return ReportController.get_dashboard_summary(db)