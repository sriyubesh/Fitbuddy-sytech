"""
Workout planning and nutrition endpoints for FitBuddy.
"""

import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.workout import WorkoutPlan
from app.schemas.workout import (
    GeneratePlanRequest,
    WorkoutPlanResponse,
    WorkoutPlanData,
    NutritionTipRequest,
    NutritionTipResponse,
)
from app.services.workout_service import create_workout_plan, get_user_plans
from app.services.nutrition_service import get_nutrition_tip

router = APIRouter(prefix="", tags=["Workout Plans & Nutrition"])


def _format_plan_response(plan: WorkoutPlan) -> WorkoutPlanResponse:
    """Helper to deserialize plan_data into Pydantic WorkoutPlanData."""
    try:
        data_dict = json.loads(plan.plan_data)
        plan_data_obj = WorkoutPlanData.model_validate(data_dict)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database stored workout plan could not be decoded: {str(e)}"
        )
    return WorkoutPlanResponse(
        id=plan.id,
        user_id=plan.user_id,
        plan_data=plan_data_obj,
        created_at=plan.created_at,
    )


@router.post(
    "/generate-plan",
    response_model=WorkoutPlanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate personalized 7-day workout plan using Gemini AI"
)
def generate_plan(payload: GeneratePlanRequest, db: Session = Depends(get_db)):
    """
    Accepts user information or user_id, generates a tailored 7-day workout plan
    using Gemini AI, validates structure, and saves to SQLite.
    """
    # 1. Determine user
    user = None
    if payload.user_id:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail=f"User ID {payload.user_id} not found")

    if not user:
        # Check required fields to create new user profile
        required_fields = ["name", "age", "weight", "goal", "intensity", "experience"]
        missing = [f for f in required_fields if getattr(payload, f) is None]
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Missing required user fields to generate plan: {', '.join(missing)}"
            )

        # Create user profile
        user = User(
            name=payload.name.strip(),
            age=payload.age,
            weight=payload.weight,
            goal=payload.goal,
            intensity=payload.intensity,
            experience=payload.experience,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 2. Generate workout plan via service layer
    try:
        new_plan = create_workout_plan(db, user)
    except ValueError as e:
        # AI response structure failure or parsing failure
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI Workout Plan generation error: {str(e)}"
        )
    except RuntimeError as e:
        # Gemini API connectivity / auth error
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Gemini AI service unavailable: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error while generating workout plan: {str(e)}"
        )

    return _format_plan_response(new_plan)


@router.post(
    "/nutrition-tip",
    response_model=NutritionTipResponse,
    summary="Generate general nutrition or recovery tip based on fitness goal"
)
def nutrition_tip(payload: NutritionTipRequest):
    """
    Generates a concise nutrition or recovery recommendation for the specified fitness goal.
    Educates and motivates without medical claims.
    """
    try:
        res = get_nutrition_tip(payload.goal, payload.name)
        return NutritionTipResponse(
            goal=res["goal"],
            tip=res["tip"],
            disclaimer=res["disclaimer"],
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not generate nutrition tip: {str(e)}"
        )


@router.get(
    "/plans/{user_id}",
    response_model=List[WorkoutPlanResponse],
    summary="Get workout plan history for a user"
)
def get_plans_for_user(user_id: int, db: Session = Depends(get_db)):
    """Retrieve all previously generated workout plans for the specified user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")

    plans = get_user_plans(db, user_id)
    return [_format_plan_response(p) for p in plans]
