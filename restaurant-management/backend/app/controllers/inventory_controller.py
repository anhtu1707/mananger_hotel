from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.inventory import InventoryItem, InventoryUnit
from datetime import datetime
from typing import Optional

class InventoryController:
    @staticmethod
    def create_inventory_item(db: Session, name: str, unit: str, category: str = None,
                             current_stock: float = 0, minimum_stock: float = 0,
                             unit_price: float = None, supplier: str = None,
                             expiry_date: datetime = None):
        try:
            unit_enum = InventoryUnit(unit)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid unit. Must be one of: {[u.value for u in InventoryUnit]}"
            )
        
        inventory_item = InventoryItem(
            name=name,
            category=category,
            unit=unit_enum,
            current_stock=current_stock,
            minimum_stock=minimum_stock,
            unit_price=unit_price,
            supplier=supplier,
            expiry_date=expiry_date
        )
        db.add(inventory_item)
        db.commit()
        db.refresh(inventory_item)
        return inventory_item

    @staticmethod
    def get_inventory_items(db: Session, skip: int = 0, limit: int = 100,
                           category: Optional[str] = None, low_stock_only: bool = False):
        query = db.query(InventoryItem)
        
        if category:
            query = query.filter(InventoryItem.category == category)
        
        if low_stock_only:
            query = query.filter(InventoryItem.current_stock <= InventoryItem.minimum_stock)
        
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_inventory_item_by_id(db: Session, item_id: int):
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        return item

    @staticmethod
    def update_inventory_item(db: Session, item_id: int, **kwargs):
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        for key, value in kwargs.items():
            if hasattr(item, key) and value is not None:
                if key == "unit":
                    try:
                        setattr(item, key, InventoryUnit(value))
                    except ValueError:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Invalid unit. Must be one of: {[u.value for u in InventoryUnit]}"
                        )
                else:
                    setattr(item, key, value)
        
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_inventory_item(db: Session, item_id: int):
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        db.delete(item)
        db.commit()
        return {"message": "Inventory item deleted successfully"}

    @staticmethod
    def update_stock(db: Session, item_id: int, new_stock: float):
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        if new_stock < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stock cannot be negative"
            )
        
        item.current_stock = new_stock
        item.last_restocked = datetime.now()
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def restock_item(db: Session, item_id: int, quantity: float):
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Restock quantity must be positive"
            )
        
        item.current_stock += quantity
        item.last_restocked = datetime.now()
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def consume_stock(db: Session, item_id: int, quantity: float):
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Consumption quantity must be positive"
            )
        
        if item.current_stock < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient stock"
            )
        
        item.current_stock -= quantity
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def get_low_stock_items(db: Session):
        return db.query(InventoryItem).filter(
            InventoryItem.current_stock <= InventoryItem.minimum_stock
        ).all()

    @staticmethod
    def get_expired_items(db: Session):
        return db.query(InventoryItem).filter(
            InventoryItem.expiry_date <= datetime.now()
        ).all()

    @staticmethod
    def get_units(db: Session):
        return [{"value": unit.value, "label": unit.value.upper()} 
                for unit in InventoryUnit]

    @staticmethod
    def get_categories(db: Session):
        categories = db.query(InventoryItem.category).distinct().filter(
            InventoryItem.category.isnot(None)
        ).all()
        return [{"value": cat[0], "label": cat[0]} for cat in categories if cat[0]]