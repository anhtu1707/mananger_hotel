from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.database import engine, Base
from app.controllers import (
    auth_router,
    user_router,
    menu_router,
    employee_router,
    table_router,
    inventory_router,
    order_router,
    bill_router,
    report_router
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Restaurant Management API",
    description="API for managing restaurant operations",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(menu_router)
app.include_router(employee_router)
app.include_router(table_router)
app.include_router(inventory_router)
app.include_router(order_router)
app.include_router(bill_router)
app.include_router(report_router)

@app.get("/")
async def root():
    return {"message": "Restaurant Management API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)