from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.menu import MenuItem, MenuCategory
from typing import Optional

class MenuController:
    @staticmethod
    def create_menu_item(db: Session, name: str, price: float, category: str, 
                        description: str = None, image_url: str = None, 
                        preparation_time: int = None, ingredients: str = None):
        try:
            category_enum = MenuCategory(category)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid category. Must be one of: {[c.value for c in MenuCategory]}"
            )
        
        menu_item = MenuItem(
            name=name,
            description=description,
            price=price,
            category=category_enum,
            image_url=image_url,
            preparation_time=preparation_time,
            ingredients=ingredients
        )
        db.add(menu_item)
        db.commit()
        db.refresh(menu_item)
        return menu_item

    @staticmethod
    def get_menu_items(db: Session, skip: int = 0, limit: int = 100, 
                      category: Optional[str] = None, available_only: bool = False):
        query = db.query(MenuItem)
        
        if category:
            try:
                category_enum = MenuCategory(category)
                query = query.filter(MenuItem.category == category_enum)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid category. Must be one of: {[c.value for c in MenuCategory]}"
                )
        
        if available_only:
            query = query.filter(MenuItem.is_available == True)
        
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_menu_item_by_id(db: Session, item_id: int):
        item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Menu item not found")
        return item

    @staticmethod
    def update_menu_item(db: Session, item_id: int, **kwargs):
        item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Menu item not found")
        
        for key, value in kwargs.items():
            if hasattr(item, key) and value is not None:
                if key == "category":
                    try:
                        setattr(item, key, MenuCategory(value))
                    except ValueError:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Invalid category. Must be one of: {[c.value for c in MenuCategory]}"
                        )
                else:
                    setattr(item, key, value)
        
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_menu_item(db: Session, item_id: int):
        item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Menu item not found")
        
        db.delete(item)
        db.commit()
        return {"message": "Menu item deleted successfully"}

    @staticmethod
    def toggle_availability(db: Session, item_id: int):
        item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Menu item not found")
        
        item.is_available = not item.is_available
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def get_categories(db: Session):
        return [{"value": category.value, "label": category.value.replace("_", " ").title()} 
                for category in MenuCategory]