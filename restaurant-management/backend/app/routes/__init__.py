from .auth_routes import router as auth_router
from .menu_routes import router as menu_router
from .employee_routes import router as employee_router
from .table_routes import router as table_router
from .inventory_routes import router as inventory_router
from .order_routes import router as order_router
from .report_routes import router as report_router

__all__ = [
    "auth_router",
    "menu_router",
    "employee_router",
    "table_router", 
    "inventory_router",
    "order_router",
    "report_router"
]