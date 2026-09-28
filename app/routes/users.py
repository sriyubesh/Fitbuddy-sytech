"""
User endpoints for FitBuddy.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="", tags=["Users"])


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user fitness profile"
)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user profile with age, weight, goal, intensity, and experience.
    Inputs are strictly validated by Pydantic.
    """
    new_user = User(
        name=user_in.name,
        age=user_in.age,
        weight=user_in.weight,
        goal=user_in.goal,
        intensity=user_in.intensity,
        experience=user_in.experience,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Get user profile by ID"
)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")
    return user


@router.get(
    "/users",
    response_model=List[UserResponse],
    summary="List all registered user profiles"
)
def list_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.id.desc()).all()
