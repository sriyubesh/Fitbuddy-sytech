"""
Pydantic schemas for User Feedback and Plan Iteration.
"""

from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.schemas.workout import WorkoutPlanData


class FeedbackRequest(BaseModel):
    user_id: int = Field(..., description="ID of the user submitting feedback")
    plan_id: int = Field(..., description="ID of the current workout plan being modified")
    feedback_text: str = Field(..., min_length=3, max_length=1000, description="User's feedback or requested adjustments")

    @field_validator("feedback_text")
    @classmethod
    def validate_feedback(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Feedback text must be at least 3 characters long")
        return v


class FeedbackResponse(BaseModel):
    id: int
    user_id: int
    plan_id: int
    feedback_text: str
    updated_plan: WorkoutPlanData
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
