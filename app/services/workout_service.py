"""
Workout service orchestrating workout generation, validation, and database operations.
"""

import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.workout import WorkoutPlan
from app.services.gemini import generate_workout_plan_ai


def create_workout_plan(
    db: Session,
    user: User,
    user_data_override: Optional[Dict[str, Any]] = None
) -> WorkoutPlan:
    """
    Generate an AI workout plan for a user, validate it, and persist to SQLite database.
    """
    user_data = {
        "name": user.name,
        "age": user.age,
        "weight": user.weight,
        "goal": user.goal,
        "intensity": user.intensity,
        "experience": user.experience,
    }
    if user_data_override:
        user_data.update(user_data_override)

    # Call Gemini service (validates structure against WorkoutPlanData)
    plan_dict = generate_workout_plan_ai(user_data)

    # Persist in SQLite
    new_plan = WorkoutPlan(
        user_id=user.id,
        plan_data=json.dumps(plan_dict)
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    return new_plan


def get_user_plans(db: Session, user_id: int) -> List[WorkoutPlan]:
    """Retrieve all workout plans for a specific user ordered by newest first."""
    return db.query(WorkoutPlan).filter(WorkoutPlan.user_id == user_id).order_by(WorkoutPlan.created_at.desc()).all()


def get_plan_by_id(db: Session, plan_id: int) -> Optional[WorkoutPlan]:
    """Retrieve a single workout plan by its ID."""
    return db.query(WorkoutPlan).filter(WorkoutPlan.id == plan_id).first()
