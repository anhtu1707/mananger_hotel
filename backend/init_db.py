from sqlalchemy.orm import Session
from database.database import engine, Base, SessionLocal
from app.models import User, MenuItem, Employee, Table, Inventory
from app.utils.auth import get_password_hash
from datetime import date

def init_database():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Create admin user
        admin_user = User(
            username="admin",
            email="admin@restaurant.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Administrator",
            role="admin"
        )
        db.add(admin_user)
        
        # Create staff user
        staff_user = User(
            username="staff",
            email="staff@restaurant.com",
            hashed_password=get_password_hash("staff123"),
            full_name="Staff User",
            role="staff"
        )
        db.add(staff_user)
        
        # Create sample menu items
        menu_items = [
            MenuItem(name="Phở Bò", description="Traditional Vietnamese beef noodle soup", price=75000, category="main_course", is_available=True),
            MenuItem(name="Bún Chả", description="Grilled pork with vermicelli", price=65000, category="main_course", is_available=True),
            MenuItem(name="Gỏi Cuốn", description="Fresh spring rolls", price=45000, category="appetizer", is_available=True),
            MenuItem(name="Bánh Mì", description="Vietnamese sandwich", price=35000, category="main_course", is_available=True),
            MenuItem(name="Cà Phê Sữa Đá", description="Vietnamese iced coffee", price=25000, category="beverage", is_available=True),
            MenuItem(name="Chè", description="Vietnamese sweet dessert soup", price=30000, category="dessert", is_available=True),
        ]
        for item in menu_items:
            db.add(item)
        
        # Create sample employees
        employees = [
            Employee(
                employee_code="EMP001",
                full_name="Nguyễn Văn A",
                phone="0901234567",
                email="nva@restaurant.com",
                position="waiter",
                salary=8000000,
                start_date=date(2023, 1, 1)
            ),
            Employee(
                employee_code="EMP002",
                full_name="Trần Thị B",
                phone="0901234568",
                email="ttb@restaurant.com",
                position="chef",
                salary=12000000,
                start_date=date(2023, 2, 1)
            ),
        ]
        for emp in employees:
            db.add(emp)
        
        # Create sample tables
        tables = [
            Table(table_number="T01", capacity=4, location="indoor", status="available"),
            Table(table_number="T02", capacity=4, location="indoor", status="available"),
            Table(table_number="T03", capacity=6, location="indoor", status="available"),
            Table(table_number="T04", capacity=2, location="outdoor", status="available"),
            Table(table_number="VIP01", capacity=8, location="vip", status="available"),
        ]
        for table in tables:
            db.add(table)
        
        # Create sample inventory items
        inventory_items = [
            Inventory(item_name="Thịt Bò", quantity=50, unit="kg", min_quantity=10, category="meat", price_per_unit=150000),
            Inventory(item_name="Rau Muống", quantity=20, unit="kg", min_quantity=5, category="vegetable", price_per_unit=15000),
            Inventory(item_name="Gạo", quantity=100, unit="kg", min_quantity=20, category="grain", price_per_unit=25000),
            Inventory(item_name="Nước Mắm", quantity=10, unit="liter", min_quantity=2, category="spice", price_per_unit=30000),
        ]
        for item in inventory_items:
            db.add(item)
        
        db.commit()
        print("Database initialized successfully!")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()