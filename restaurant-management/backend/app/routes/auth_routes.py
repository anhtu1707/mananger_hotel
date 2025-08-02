from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from app.database.database import get_db
from app.controllers.auth_controller import AuthController
from app.auth.jwt_handler import get_current_user, get_admin_user
from app.models.user import User, UserRole

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Pydantic models for request/response
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.EMPLOYEE

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """User login endpoint"""
    return AuthController.login(db, form_data.username, form_data.password)

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db), 
                  current_user: User = Depends(get_admin_user)):
    """Register a new user (admin only)"""
    db_user = AuthController.create_user(
        db=db,
        username=user.username,
        email=user.email,
        password=user.password,
        full_name=user.full_name,
        role=user.role
    )
    return db_user

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.get("/users", response_model=List[UserResponse])
async def get_users(skip: int = 0, limit: int = 100, 
                   db: Session = Depends(get_db),
                   current_user: User = Depends(get_admin_user)):
    """Get all users (admin only)"""
    return AuthController.get_users(db, skip=skip, limit=limit)

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db),
                  current_user: User = Depends(get_admin_user)):
    """Get user by ID (admin only)"""
    user = AuthController.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate, 
                     db: Session = Depends(get_db),
                     current_user: User = Depends(get_admin_user)):
    """Update user (admin only)"""
    update_data = user_update.dict(exclude_unset=True)
    return AuthController.update_user(db, user_id, **update_data)

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db),
                     current_user: User = Depends(get_admin_user)):
    """Delete user (admin only)"""
    return AuthController.delete_user(db, user_id)