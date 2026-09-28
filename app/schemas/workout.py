"""
Pydantic schemas for Workout Plans and Nutrition Tips.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class ExerciseItem(BaseModel):
    exercise: str = Field(..., description="Name of the exercise or activity")
    sets: str = Field(..., description="Number of sets or rounds (e.g., '3-4 sets' or '3')")
    reps: str = Field(..., description="Target repetitions or duration (e.g., '10-12 reps' or '45 seconds')")
    rest: str = Field(..., description="Rest interval between sets (e.g., '60-90 sec')")


class DayPlan(BaseModel):
    day: str = Field(..., description="Day indicator, e.g., 'Day 1', 'Day 2'")
    focus: str = Field(..., description="Workout focus, e.g., 'Upper Body Push', 'Active Recovery'")
    exercises: List[ExerciseItem] = Field(default_factory=list, description="List of exercises scheduled for this day")
    rest_recovery: str = Field(..., description="Rest and recovery information for this day")


class WorkoutPlanData(BaseModel):
    plan_title: str = Field(default="Personalized 7-Day Fitness Plan", description="Title of the plan")
    overview: str = Field(..., description="Overview and coaching strategy for this customized plan")
    safety_guidelines: Optional[str] = Field(
        default="Warm up for 5-10 minutes prior to workouts, maintain proper form, and stay hydrated.",
        description="Important safety notes"
    )
    days: List[DayPlan] = Field(..., min_length=7, max_length=7, description="Structured 7-day workout schedule")


class GeneratePlanRequest(BaseModel):
    user_id: Optional[int] = Field(None, description="Existing user ID in database")
    name: Optional[str] = Field(None, description="User's name")
    age: Optional[int] = Field(None, ge=12, le=120, description="User's age")
    weight: Optional[float] = Field(None, ge=20.0, le=400.0, description="User's weight in kg")
    goal: Optional[str] = Field(None, description="Fitness goal")
    intensity: Optional[str] = Field(None, description="Workout intensity")
    experience: Optional[str] = Field(None, description="Experience level")


class WorkoutPlanResponse(BaseModel):
    id: int
    user_id: int
    plan_data: WorkoutPlanData
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class NutritionTipRequest(BaseModel):
    goal: str = Field(..., description="User's fitness goal")
    name: Optional[str] = Field(None, description="Optional user name")


class NutritionTipResponse(BaseModel):
    goal: str
    tip: str
    disclaimer: str = "This information is for general educational and wellness purposes only, not medical diagnosis or treatment."
