from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.order import Order, OrderItem, OrderStatus
from app.models.menu import MenuItem
from app.models.table import Table, TableStatus
from app.models.employee import Employee
from datetime import datetime
from typing import List, Dict, Optional
import uuid

class OrderController:
    @staticmethod
    def create_order(db: Session, table_id: int, employee_id: int, 
                    order_items: List[Dict], notes: str = None):
        # Validate table exists and is available
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        
        # Validate employee exists
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Generate unique order number
        order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Create order
        order = Order(
            order_number=order_number,
            table_id=table_id,
            employee_id=employee_id,
            notes=notes
        )
        db.add(order)
        db.flush()  # Get the order ID
        
        total_amount = 0
        
        # Create order items
        for item_data in order_items:
            menu_item = db.query(MenuItem).filter(MenuItem.id == item_data["menu_item_id"]).first()
            if not menu_item:
                raise HTTPException(status_code=404, detail=f"Menu item {item_data['menu_item_id']} not found")
            
            if not menu_item.is_available:
                raise HTTPException(status_code=400, detail=f"Menu item {menu_item.name} is not available")
            
            total_price = menu_item.price * item_data["quantity"]
            total_amount += total_price
            
            order_item = OrderItem(
                order_id=order.id,
                menu_item_id=item_data["menu_item_id"],
                quantity=item_data["quantity"],
                unit_price=menu_item.price,
                total_price=total_price,
                special_instructions=item_data.get("special_instructions")
            )
            db.add(order_item)
        
        # Calculate final amounts
        tax_rate = 0.1  # 10% tax
        tax_amount = total_amount * tax_rate
        discount_amount = 0  # Can be modified based on business logic
        final_amount = total_amount + tax_amount - discount_amount
        
        order.total_amount = total_amount
        order.tax_amount = tax_amount
        order.discount_amount = discount_amount
        order.final_amount = final_amount
        
        # Update table status to occupied
        table.status = TableStatus.OCCUPIED
        
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def get_orders(db: Session, skip: int = 0, limit: int = 100,
                  status: Optional[str] = None, table_id: Optional[int] = None):
        query = db.query(Order)
        
        if status:
            try:
                status_enum = OrderStatus(status)
                query = query.filter(Order.status == status_enum)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status. Must be one of: {[s.value for s in OrderStatus]}"
                )
        
        if table_id:
            query = query.filter(Order.table_id == table_id)
        
        return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_order_by_id(db: Session, order_id: int):
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order

    @staticmethod
    def get_order_by_number(db: Session, order_number: str):
        order = db.query(Order).filter(Order.order_number == order_number).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order

    @staticmethod
    def update_order_status(db: Session, order_id: int, status: str):
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        try:
            status_enum = OrderStatus(status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {[s.value for s in OrderStatus]}"
            )
        
        order.status = status_enum
        
        # If order is paid, free up the table
        if status_enum == OrderStatus.PAID:
            table = db.query(Table).filter(Table.id == order.table_id).first()
            if table:
                table.status = TableStatus.AVAILABLE
        
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def add_order_item(db: Session, order_id: int, menu_item_id: int, 
                      quantity: int, special_instructions: str = None):
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order.status in [OrderStatus.PAID, OrderStatus.CANCELLED]:
            raise HTTPException(status_code=400, detail="Cannot modify paid or cancelled orders")
        
        menu_item = db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()
        if not menu_item:
            raise HTTPException(status_code=404, detail="Menu item not found")
        
        if not menu_item.is_available:
            raise HTTPException(status_code=400, detail="Menu item is not available")
        
        total_price = menu_item.price * quantity
        
        order_item = OrderItem(
            order_id=order_id,
            menu_item_id=menu_item_id,
            quantity=quantity,
            unit_price=menu_item.price,
            total_price=total_price,
            special_instructions=special_instructions
        )
        db.add(order_item)
        
        # Recalculate order totals
        OrderController._recalculate_order_totals(db, order)
        
        db.commit()
        db.refresh(order_item)
        return order_item

    @staticmethod
    def remove_order_item(db: Session, order_item_id: int):
        order_item = db.query(OrderItem).filter(OrderItem.id == order_item_id).first()
        if not order_item:
            raise HTTPException(status_code=404, detail="Order item not found")
        
        order = db.query(Order).filter(Order.id == order_item.order_id).first()
        if order.status in [OrderStatus.PAID, OrderStatus.CANCELLED]:
            raise HTTPException(status_code=400, detail="Cannot modify paid or cancelled orders")
        
        db.delete(order_item)
        
        # Recalculate order totals
        OrderController._recalculate_order_totals(db, order)
        
        db.commit()
        return {"message": "Order item removed successfully"}

    @staticmethod
    def cancel_order(db: Session, order_id: int):
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order.status == OrderStatus.PAID:
            raise HTTPException(status_code=400, detail="Cannot cancel paid orders")
        
        order.status = OrderStatus.CANCELLED
        
        # Free up the table
        table = db.query(Table).filter(Table.id == order.table_id).first()
        if table:
            table.status = TableStatus.AVAILABLE
        
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def _recalculate_order_totals(db: Session, order: Order):
        # Recalculate total from all order items
        total_amount = sum(item.total_price for item in order.order_items)
        
        tax_rate = 0.1  # 10% tax
        tax_amount = total_amount * tax_rate
        discount_amount = order.discount_amount  # Keep existing discount
        final_amount = total_amount + tax_amount - discount_amount
        
        order.total_amount = total_amount
        order.tax_amount = tax_amount
        order.final_amount = final_amount

    @staticmethod
    def apply_discount(db: Session, order_id: int, discount_amount: float):
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if discount_amount < 0 or discount_amount > order.total_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid discount amount"
            )
        
        order.discount_amount = discount_amount
        order.final_amount = order.total_amount + order.tax_amount - discount_amount
        
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def get_order_statuses(db: Session):
        return [{"value": status.value, "label": status.value.replace("_", " ").title()} 
                for status in OrderStatus]