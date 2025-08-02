from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.table import Table, TableStatus
from typing import Optional

class TableController:
    @staticmethod
    def create_table(db: Session, table_number: int, capacity: int, 
                    location: str = None, notes: str = None):
        # Check if table number already exists
        existing_table = db.query(Table).filter(Table.table_number == table_number).first()
        if existing_table:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Table number already exists"
            )
        
        table = Table(
            table_number=table_number,
            capacity=capacity,
            location=location,
            notes=notes
        )
        db.add(table)
        db.commit()
        db.refresh(table)
        return table

    @staticmethod
    def get_tables(db: Session, skip: int = 0, limit: int = 100, 
                  status: Optional[str] = None, location: Optional[str] = None):
        query = db.query(Table)
        
        if status:
            try:
                status_enum = TableStatus(status)
                query = query.filter(Table.status == status_enum)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status. Must be one of: {[s.value for s in TableStatus]}"
                )
        
        if location:
            query = query.filter(Table.location == location)
        
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_table_by_id(db: Session, table_id: int):
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        return table

    @staticmethod
    def get_table_by_number(db: Session, table_number: int):
        table = db.query(Table).filter(Table.table_number == table_number).first()
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        return table

    @staticmethod
    def update_table(db: Session, table_id: int, **kwargs):
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        
        for key, value in kwargs.items():
            if hasattr(table, key) and value is not None:
                if key == "status":
                    try:
                        setattr(table, key, TableStatus(value))
                    except ValueError:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Invalid status. Must be one of: {[s.value for s in TableStatus]}"
                        )
                elif key == "table_number":
                    # Check if new table number already exists
                    existing = db.query(Table).filter(
                        Table.table_number == value,
                        Table.id != table_id
                    ).first()
                    if existing:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Table number already exists"
                        )
                    setattr(table, key, value)
                else:
                    setattr(table, key, value)
        
        db.commit()
        db.refresh(table)
        return table

    @staticmethod
    def delete_table(db: Session, table_id: int):
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        
        db.delete(table)
        db.commit()
        return {"message": "Table deleted successfully"}

    @staticmethod
    def update_table_status(db: Session, table_id: int, status: str):
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        
        try:
            status_enum = TableStatus(status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {[s.value for s in TableStatus]}"
            )
        
        table.status = status_enum
        db.commit()
        db.refresh(table)
        return table

    @staticmethod
    def get_available_tables(db: Session):
        return db.query(Table).filter(Table.status == TableStatus.AVAILABLE).all()

    @staticmethod
    def get_table_statuses(db: Session):
        return [{"value": status.value, "label": status.value.replace("_", " ").title()} 
                for status in TableStatus]

    @staticmethod
    def get_locations(db: Session):
        locations = db.query(Table.location).distinct().filter(Table.location.isnot(None)).all()
        return [{"value": loc[0], "label": loc[0]} for loc in locations if loc[0]]