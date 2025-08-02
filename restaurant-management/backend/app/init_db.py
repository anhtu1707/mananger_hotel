from sqlalchemy.orm import Session
from app.database.database import SessionLocal, engine, Base
from app.models import *
from app.auth.password_handler import hash_password
from datetime import datetime, date

def init_database():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            # Create default admin user
            admin_user = User(
                username="admin",
                email="admin@restaurant.com",
                hashed_password=hash_password("admin123"),
                full_name="System Administrator",
                role=UserRole.ADMIN
            )
            db.add(admin_user)
            db.commit()
            print("Default admin user created: username='admin', password='admin123'")
        
        # Create sample data if tables are empty
        if db.query(MenuItem).count() == 0:
            sample_menu_items = [
                MenuItem(name="Phở Bò", description="Authentic Vietnamese beef noodle soup", price=85000, category=MenuCategory.MAIN_COURSE, preparation_time=15),
                MenuItem(name="Bánh Mì", description="Vietnamese sandwich with meat and vegetables", price=35000, category=MenuCategory.MAIN_COURSE, preparation_time=5),
                MenuItem(name="Gỏi Cuốn", description="Fresh spring rolls with shrimp", price=45000, category=MenuCategory.APPETIZER, preparation_time=10),
                MenuItem(name="Cà Phê Sữa Đá", description="Vietnamese iced coffee with condensed milk", price=25000, category=MenuCategory.BEVERAGE, preparation_time=3),
                MenuItem(name="Chè Ba Màu", description="Three-color sweet dessert", price=30000, category=MenuCategory.DESSERT, preparation_time=5)
            ]
            db.add_all(sample_menu_items)
            db.commit()
            print("Sample menu items created")
        
        if db.query(Table).count() == 0:
            sample_tables = [
                Table(table_number=1, capacity=2, location="Indoor"),
                Table(table_number=2, capacity=4, location="Indoor"),
                Table(table_number=3, capacity=6, location="Indoor"),
                Table(table_number=4, capacity=2, location="Outdoor"),
                Table(table_number=5, capacity=4, location="Outdoor"),
            ]
            db.add_all(sample_tables)
            db.commit()
            print("Sample tables created")
        
        if db.query(Employee).count() == 0:
            sample_employees = [
                Employee(employee_code="EMP001", full_name="Nguyễn Văn A", position=EmployeePosition.WAITER, salary=8000000, hire_date=datetime.now()),
                Employee(employee_code="EMP002", full_name="Trần Thị B", position=EmployeePosition.CHEF, salary=12000000, hire_date=datetime.now()),
                Employee(employee_code="EMP003", full_name="Lê Văn C", position=EmployeePosition.CASHIER, salary=9000000, hire_date=datetime.now()),
            ]
            db.add_all(sample_employees)
            db.commit()
            print("Sample employees created")
        
        if db.query(InventoryItem).count() == 0:
            sample_inventory = [
                InventoryItem(name="Rice noodles", category="Noodles", unit=InventoryUnit.KG, current_stock=50, minimum_stock=10, unit_price=25000),
                InventoryItem(name="Beef", category="Meat", unit=InventoryUnit.KG, current_stock=20, minimum_stock=5, unit_price=300000),
                InventoryItem(name="Coffee beans", category="Beverages", unit=InventoryUnit.KG, current_stock=10, minimum_stock=2, unit_price=200000),
                InventoryItem(name="Condensed milk", category="Dairy", unit=InventoryUnit.CAN, current_stock=30, minimum_stock=5, unit_price=15000),
            ]
            db.add_all(sample_inventory)
            db.commit()
            print("Sample inventory items created")
        
        print("Database initialization completed!")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()