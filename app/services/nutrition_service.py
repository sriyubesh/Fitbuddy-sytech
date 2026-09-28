"""
Nutrition and recovery service for FitBuddy.
"""

from typing import Optional, Dict
from app.services.gemini import generate_nutrition_tip_ai


def get_nutrition_tip(goal: str, name: Optional[str] = None) -> Dict[str, str]:
    """
    Generate or retrieve a safe, tailored general nutrition/recovery tip based on fitness goal.
    Does not provide medical diagnosis or treatment.
    """
    cleaned_goal = goal.strip() if goal else "General Fitness"
    tip_text = generate_nutrition_tip_ai(cleaned_goal, name)

    return {
        "goal": cleaned_goal,
        "tip": tip_text,
        "disclaimer": "This information is for general educational and wellness purposes only, not medical diagnosis or treatment."
    }
