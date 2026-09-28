"""
Feedback and plan iteration endpoints for FitBuddy.
"""

import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.workout import WorkoutPlan
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackRequest, FeedbackResponse
from app.schemas.workout import WorkoutPlanData
from app.services.gemini import regenerate_workout_plan_ai

router = APIRouter(prefix="", tags=["Feedback"])


@router.post(
    "/feedback",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit feedback to adjust and regenerate workout plan with Gemini AI"
)
def submit_feedback(payload: FeedbackRequest, db: Session = Depends(get_db)):
    """
    Submits user feedback about an existing workout plan.
    Sends existing plan, user profile, and user feedback to Gemini AI.
    Generates updated plan and stores both feedback and updated plan in SQLite.
    """
    # 1. Fetch user
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID {payload.user_id} not found")

    # 2. Fetch target workout plan
    plan = db.query(WorkoutPlan).filter(WorkoutPlan.id == payload.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Workout plan with ID {payload.plan_id} not found")

    if plan.user_id != user.id:
        raise HTTPException(status_code=400, detail="Plan does not belong to the specified user")

    # 3. Parse existing plan
    try:
        current_plan_data = json.loads(plan.plan_data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not read existing plan data: {str(e)}"
        )

    user_data = {
        "name": user.name,
        "age": user.age,
        "weight": user.weight,
        "goal": user.goal,
        "intensity": user.intensity,
        "experience": user.experience,
    }

    # 4. Request updated plan from Gemini
    try:
        updated_plan_dict = regenerate_workout_plan_ai(
            user_data=user_data,
            current_plan=current_plan_data,
            feedback_text=payload.feedback_text
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI Workout Plan update error: {str(e)}"
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Gemini AI service unavailable: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error while regenerating workout plan: {str(e)}"
        )

    # 5. Persist feedback and also update current plan or create a new updated plan in SQLite
    updated_plan_json = json.dumps(updated_plan_dict)

    feedback_record = Feedback(
        user_id=user.id,
        plan_id=plan.id,
        feedback_text=payload.feedback_text,
        updated_plan=updated_plan_json
    )
    db.add(feedback_record)

    # Also update the workout plan's data so subsequent views or feedbacks reflect the updated plan
    plan.plan_data = updated_plan_json

    db.commit()
    db.refresh(feedback_record)

    validated_updated_plan = WorkoutPlanData.model_validate(updated_plan_dict)

    return FeedbackResponse(
        id=feedback_record.id,
        user_id=feedback_record.user_id,
        plan_id=feedback_record.plan_id,
        feedback_text=feedback_record.feedback_text,
        updated_plan=validated_updated_plan,
        created_at=feedback_record.created_at,
    )
