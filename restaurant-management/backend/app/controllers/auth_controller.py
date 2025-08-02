from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.auth.password_handler import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from datetime import timedelta

class AuthController:
    @staticmethod
    def authenticate_user(db: Session, username: str, password: str):
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return False
        if not verify_password(password, user.hashed_password):
            return False
        return user

    @staticmethod
    def login(db: Session, username: str, password: str):
        user = AuthController.authenticate_user(db, username, password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value
            }
        }

    @staticmethod
    def create_user(db: Session, username: str, email: str, password: str, full_name: str, role: str):
        # Check if user already exists
        db_user = db.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already registered"
            )
        
        hashed_password = hash_password(password)
        db_user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            role=role
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100):
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int):
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def update_user(db: Session, user_id: int, **kwargs):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        for key, value in kwargs.items():
            if hasattr(user, key) and value is not None:
                if key == "password":
                    setattr(user, "hashed_password", hash_password(value))
                else:
                    setattr(user, key, value)
        
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def delete_user(db: Session, user_id: int):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        db.delete(user)
        db.commit()
        return {"message": "User deleted successfully"}