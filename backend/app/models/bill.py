from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.database import Base

class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    bill_number = Column(String(20), unique=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    total_amount = Column(Float, nullable=False)
    payment_method = Column(String(20))  # cash, card, transfer
    payment_status = Column(String(20), default="pending")  # pending, paid, cancelled
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    order = relationship("Order", backref="bill")