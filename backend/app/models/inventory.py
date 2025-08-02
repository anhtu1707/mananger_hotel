from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from database.database import Base

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String(100), nullable=False)
    description = Column(Text)
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)  # kg, liter, piece, box
    min_quantity = Column(Float, default=0)
    price_per_unit = Column(Float)
    supplier = Column(String(100))
    category = Column(String(50))  # vegetable, meat, seafood, spice, beverage
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())