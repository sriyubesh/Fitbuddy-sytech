"""
Pydantic schemas for User validation and serialization.
"""

from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, field_validator, ConfigDict


class GoalEnum(str, Enum):
    WEIGHT_LOSS = "Weight Loss"
    MUSCLE_GAIN = "Muscle Gain"
    GENERAL_FITNESS = "General Fitness"
    STRENGTH = "Strength"
    ENDURANCE = "Endurance"


class IntensityEnum(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class ExperienceEnum(str, Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"


def _normalize_enum_value(val: str, enum_cls):
    if not isinstance(val, str):
        return val
    cleaned = val.strip().lower()
    for member in enum_cls:
        if member.value.lower() == cleaned:
            return member.value
    # If not matched, return original to let standard validation report the allowed values
    return val


class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Full or first name of the user")
    age: int = Field(..., ge=12, le=120, description="Age in years (12-120)")
    weight: float = Field(..., ge=20.0, le=400.0, description="Weight in kilograms (20-400 kg)")
    goal: str = Field(..., description="Fitness goal: Weight Loss, Muscle Gain, General Fitness, Strength, Endurance")
    intensity: str = Field(..., description="Workout intensity: Low, Medium, High")
    experience: str = Field(..., description="Experience level: Beginner, Intermediate, Advanced")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty or whitespace only")
        return v

    @field_validator("goal", mode="before")
    @classmethod
    def validate_goal(cls, v: str) -> str:
        normalized = _normalize_enum_value(v, GoalEnum)
        valid_values = [e.value for e in GoalEnum]
        if normalized not in valid_values:
            raise ValueError(f"Invalid fitness goal '{v}'. Must be one of: {', '.join(valid_values)}")
        return normalized

    @field_validator("intensity", mode="before")
    @classmethod
    def validate_intensity(cls, v: str) -> str:
        normalized = _normalize_enum_value(v, IntensityEnum)
        valid_values = [e.value for e in IntensityEnum]
        if normalized not in valid_values:
            raise ValueError(f"Invalid intensity '{v}'. Must be one of: {', '.join(valid_values)}")
        return normalized

    @field_validator("experience", mode="before")
    @classmethod
    def validate_experience(cls, v: str) -> str:
        normalized = _normalize_enum_value(v, ExperienceEnum)
        valid_values = [e.value for e in ExperienceEnum]
        if normalized not in valid_values:
            raise ValueError(f"Invalid experience level '{v}'. Must be one of: {', '.join(valid_values)}")
        return normalized


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
