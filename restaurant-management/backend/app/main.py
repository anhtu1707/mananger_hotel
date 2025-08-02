from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import engine, Base
from app.routes import (
    auth_router,
    menu_router,
    employee_router,
    table_router,
    inventory_router,
    order_router,
    report_router
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Restaurant Management System API",
    description="A comprehensive restaurant management system with menu, orders, inventory, and reporting",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth_router, prefix="/api")
app.include_router(menu_router, prefix="/api")
app.include_router(employee_router, prefix="/api")
app.include_router(table_router, prefix="/api")
app.include_router(inventory_router, prefix="/api")
app.include_router(order_router, prefix="/api")
app.include_router(report_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Restaurant Management System API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)