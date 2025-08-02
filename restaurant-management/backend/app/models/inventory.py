from sqlalchemy import Column, Integer, String, Float, DateTime, Enum
from sqlalchemy.sql import func
from app.database.database import Base
import enum

class InventoryUnit(enum.Enum):
    KG = "kg"
    GRAM = "gram"
    LITER = "liter"
    ML = "ml"
    PIECE = "piece"
    BOTTLE = "bottle"
    CAN = "can"
    PACKAGE = "package"

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    category = Column(String(50))
    unit = Column(Enum(InventoryUnit), nullable=False)
    current_stock = Column(Float, nullable=False, default=0)
    minimum_stock = Column(Float, nullable=False, default=0)
    unit_price = Column(Float)
    supplier = Column(String(100))
    expiry_date = Column(DateTime)
    last_restocked = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())