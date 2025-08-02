from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TableBase(BaseModel):
    table_number: str
    capacity: int
    location: Optional[str] = None

class TableCreate(TableBase):
    pass

class TableUpdate(BaseModel):
    capacity: Optional[int] = None
    location: Optional[str] = None
    status: Optional[str] = None

class TableResponse(TableBase):
    id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True