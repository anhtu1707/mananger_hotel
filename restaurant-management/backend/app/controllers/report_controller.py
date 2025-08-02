from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from fastapi import HTTPException, status
from app.models.order import Order, OrderStatus
from app.models.report import Report, ReportType
from datetime import datetime, date, timedelta
from typing import Optional

class ReportController:
    @staticmethod
    def generate_daily_report(db: Session, report_date: date = None):
        if not report_date:
            report_date = date.today()
        
        start_datetime = datetime.combine(report_date, datetime.min.time())
        end_datetime = datetime.combine(report_date, datetime.max.time())
        
        # Get all paid orders for the day
        orders = db.query(Order).filter(
            and_(
                Order.status == OrderStatus.PAID,
                Order.created_at >= start_datetime,
                Order.created_at <= end_datetime
            )
        ).all()
        
        # Calculate totals
        total_orders = len(orders)
        total_revenue = sum(order.total_amount for order in orders)
        total_tax = sum(order.tax_amount for order in orders)
        total_discount = sum(order.discount_amount for order in orders)
        net_revenue = sum(order.final_amount for order in orders)
        average_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        # Create or update report
        existing_report = db.query(Report).filter(
            and_(
                Report.report_type == ReportType.DAILY,
                Report.report_date == report_date
            )
        ).first()
        
        if existing_report:
            existing_report.total_orders = total_orders
            existing_report.total_revenue = total_revenue
            existing_report.total_tax = total_tax
            existing_report.total_discount = total_discount
            existing_report.net_revenue = net_revenue
            existing_report.average_order_value = average_order_value
            report = existing_report
        else:
            report = Report(
                report_type=ReportType.DAILY,
                report_date=report_date,
                start_date=report_date,
                end_date=report_date,
                total_orders=total_orders,
                total_revenue=total_revenue,
                total_tax=total_tax,
                total_discount=total_discount,
                net_revenue=net_revenue,
                average_order_value=average_order_value
            )
            db.add(report)
        
        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def generate_monthly_report(db: Session, year: int, month: int):
        # Calculate start and end dates for the month
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Get all paid orders for the month
        orders = db.query(Order).filter(
            and_(
                Order.status == OrderStatus.PAID,
                Order.created_at >= start_datetime,
                Order.created_at <= end_datetime
            )
        ).all()
        
        # Calculate totals
        total_orders = len(orders)
        total_revenue = sum(order.total_amount for order in orders)
        total_tax = sum(order.tax_amount for order in orders)
        total_discount = sum(order.discount_amount for order in orders)
        net_revenue = sum(order.final_amount for order in orders)
        average_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        # Create or update report
        report_date = date(year, month, 1)
        existing_report = db.query(Report).filter(
            and_(
                Report.report_type == ReportType.MONTHLY,
                Report.report_date == report_date
            )
        ).first()
        
        if existing_report:
            existing_report.start_date = start_date
            existing_report.end_date = end_date
            existing_report.total_orders = total_orders
            existing_report.total_revenue = total_revenue
            existing_report.total_tax = total_tax
            existing_report.total_discount = total_discount
            existing_report.net_revenue = net_revenue
            existing_report.average_order_value = average_order_value
            report = existing_report
        else:
            report = Report(
                report_type=ReportType.MONTHLY,
                report_date=report_date,
                start_date=start_date,
                end_date=end_date,
                total_orders=total_orders,
                total_revenue=total_revenue,
                total_tax=total_tax,
                total_discount=total_discount,
                net_revenue=net_revenue,
                average_order_value=average_order_value
            )
            db.add(report)
        
        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def get_revenue_by_period(db: Session, start_date: date, end_date: date):
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        orders = db.query(Order).filter(
            and_(
                Order.status == OrderStatus.PAID,
                Order.created_at >= start_datetime,
                Order.created_at <= end_datetime
            )
        ).all()
        
        return {
            "start_date": start_date,
            "end_date": end_date,
            "total_orders": len(orders),
            "total_revenue": sum(order.total_amount for order in orders),
            "total_tax": sum(order.tax_amount for order in orders),
            "total_discount": sum(order.discount_amount for order in orders),
            "net_revenue": sum(order.final_amount for order in orders),
            "average_order_value": sum(order.total_amount for order in orders) / len(orders) if orders else 0,
            "orders": orders
        }

    @staticmethod
    def get_daily_revenue_chart(db: Session, start_date: date, end_date: date):
        daily_data = []
        current_date = start_date
        
        while current_date <= end_date:
            start_datetime = datetime.combine(current_date, datetime.min.time())
            end_datetime = datetime.combine(current_date, datetime.max.time())
            
            orders = db.query(Order).filter(
                and_(
                    Order.status == OrderStatus.PAID,
                    Order.created_at >= start_datetime,
                    Order.created_at <= end_datetime
                )
            ).all()
            
            daily_revenue = sum(order.final_amount for order in orders)
            daily_orders = len(orders)
            
            daily_data.append({
                "date": current_date.isoformat(),
                "revenue": daily_revenue,
                "orders": daily_orders
            })
            
            current_date += timedelta(days=1)
        
        return daily_data

    @staticmethod
    def get_top_selling_items(db: Session, start_date: date, end_date: date, limit: int = 10):
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Query to get top selling items
        from app.models.order import OrderItem
        from app.models.menu import MenuItem
        
        result = db.query(
            MenuItem.name,
            MenuItem.price,
            func.sum(OrderItem.quantity).label('total_quantity'),
            func.sum(OrderItem.total_price).label('total_revenue')
        ).join(
            OrderItem, MenuItem.id == OrderItem.menu_item_id
        ).join(
            Order, OrderItem.order_id == Order.id
        ).filter(
            and_(
                Order.status == OrderStatus.PAID,
                Order.created_at >= start_datetime,
                Order.created_at <= end_datetime
            )
        ).group_by(
            MenuItem.id, MenuItem.name, MenuItem.price
        ).order_by(
            func.sum(OrderItem.quantity).desc()
        ).limit(limit).all()
        
        return [
            {
                "item_name": item.name,
                "unit_price": item.price,
                "total_quantity": item.total_quantity,
                "total_revenue": item.total_revenue
            }
            for item in result
        ]

    @staticmethod
    def get_reports(db: Session, report_type: Optional[str] = None, 
                   start_date: Optional[date] = None, end_date: Optional[date] = None,
                   skip: int = 0, limit: int = 100):
        query = db.query(Report)
        
        if report_type:
            try:
                type_enum = ReportType(report_type)
                query = query.filter(Report.report_type == type_enum)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid report type. Must be one of: {[t.value for t in ReportType]}"
                )
        
        if start_date:
            query = query.filter(Report.report_date >= start_date)
        
        if end_date:
            query = query.filter(Report.report_date <= end_date)
        
        return query.order_by(Report.report_date.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_dashboard_summary(db: Session):
        today = date.today()
        yesterday = today - timedelta(days=1)
        this_month_start = date(today.year, today.month, 1)
        last_month = this_month_start - timedelta(days=1)
        last_month_start = date(last_month.year, last_month.month, 1)
        
        # Today's stats
        today_stats = ReportController.get_revenue_by_period(db, today, today)
        
        # Yesterday's stats
        yesterday_stats = ReportController.get_revenue_by_period(db, yesterday, yesterday)
        
        # This month's stats
        this_month_stats = ReportController.get_revenue_by_period(db, this_month_start, today)
        
        # Last month's stats
        last_month_stats = ReportController.get_revenue_by_period(db, last_month_start, last_month)
        
        return {
            "today": {
                "revenue": today_stats["net_revenue"],
                "orders": today_stats["total_orders"],
                "average_order": today_stats["average_order_value"]
            },
            "yesterday": {
                "revenue": yesterday_stats["net_revenue"],
                "orders": yesterday_stats["total_orders"],
                "average_order": yesterday_stats["average_order_value"]
            },
            "this_month": {
                "revenue": this_month_stats["net_revenue"],
                "orders": this_month_stats["total_orders"],
                "average_order": this_month_stats["average_order_value"]
            },
            "last_month": {
                "revenue": last_month_stats["net_revenue"],
                "orders": last_month_stats["total_orders"],
                "average_order": last_month_stats["average_order_value"]
            }
        }