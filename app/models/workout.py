"""
WorkoutPlan model for storing generated 7-day fitness plans.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_data = Column(Text, nullable=False)  # Stores JSON serialized 7-day plan structure
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="workout_plans")
    feedbacks = relationship("Feedback", back_populates="workout_plan", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<WorkoutPlan(id={self.id}, user_id={self.user_id})>"
