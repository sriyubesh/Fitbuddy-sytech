"""
Tests for Workout Plan generation, Nutrition/Recovery tips, Feedback revision, and History.
"""

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

client = TestClient(app)

MOCK_7_DAY_PLAN = {
    "plan_title": "7-Day Muscle Gain Plan for Arun",
    "overview": "Balanced hyper-trophy focused 7-day program customized for beginner progression.",
    "safety_guidelines": "Always perform dynamic warmup before lifting.",
    "days": [
        {
            "day": "Day 1",
            "focus": "Upper Body Push",
            "exercises": [
                {"exercise": "Dumbbell Bench Press", "sets": "3 sets", "reps": "10-12 reps", "rest": "60 sec"},
                {"exercise": "Push-Ups", "sets": "3 sets", "reps": "8-10 reps", "rest": "60 sec"}
            ],
            "rest_recovery": "Gentle arm stretches and hydration."
        },
        {
            "day": "Day 2",
            "focus": "Lower Body Foundation",
            "exercises": [
                {"exercise": "Goblet Squats", "sets": "3 sets", "reps": "12 reps", "rest": "90 sec"},
                {"exercise": "Romanian Deadlift with Dumbbells", "sets": "3 sets", "reps": "10 reps", "rest": "90 sec"}
            ],
            "rest_recovery": "Hamstring and quad foam rolling."
        },
        {
            "day": "Day 3",
            "focus": "Active Recovery & Mobility",
            "exercises": [
                {"exercise": "Brisk Walking", "sets": "1 session", "reps": "30 minutes", "rest": "N/A"},
                {"exercise": "Full Body Mobility Stretches", "sets": "2 rounds", "reps": "10 min", "rest": "30 sec"}
            ],
            "rest_recovery": "Ensure 8 hours of sleep and high hydration."
        },
        {
            "day": "Day 4",
            "focus": "Upper Body Pull & Core",
            "exercises": [
                {"exercise": "Lat Pulldown or Band Pull-Apart", "sets": "3 sets", "reps": "12 reps", "rest": "60 sec"},
                {"exercise": "Plank", "sets": "3 sets", "reps": "30-45 sec", "rest": "45 sec"}
            ],
            "rest_recovery": "Upper back release."
        },
        {
            "day": "Day 5",
            "focus": "Full Body Circuit",
            "exercises": [
                {"exercise": "Bodyweight Lunges", "sets": "3 sets", "reps": "10 reps/side", "rest": "60 sec"},
                {"exercise": "Dumbbell Overhead Press", "sets": "3 sets", "reps": "10 reps", "rest": "60 sec"}
            ],
            "rest_recovery": "Post-workout protein and cooldown walk."
        },
        {
            "day": "Day 6",
            "focus": "Light Aerobic & Core",
            "exercises": [
                {"exercise": "Cycling or Light Jogging", "sets": "1 session", "reps": "25 mins", "rest": "N/A"},
                {"exercise": "Bird-Dog and Deadbug", "sets": "3 sets", "reps": "10 reps", "rest": "30 sec"}
            ],
            "rest_recovery": "Contrast shower and rest."
        },
        {
            "day": "Day 7",
            "focus": "Complete Rest & Restoration",
            "exercises": [
                {"exercise": "Restorative Walk / Yoga", "sets": "1 session", "reps": "20 mins", "rest": "N/A"}
            ],
            "rest_recovery": "Plan upcoming week's meals and rest deeply."
        }
    ]
}

MOCK_UPDATED_PLAN = {
    "plan_title": "Updated 7-Day Plan with Extra Cardio",
    "overview": "Modified plan reflecting user feedback requesting additional cardiovascular conditioning.",
    "safety_guidelines": "Stay well hydrated during extended cardio intervals.",
    "days": [
        {
            "day": "Day 1",
            "focus": "Upper Body & 15-min Cardio Finisher",
            "exercises": [
                {"exercise": "Dumbbell Press", "sets": "3 sets", "reps": "10 reps", "rest": "60 sec"},
                {"exercise": "Incline Treadmill Walk", "sets": "1 session", "reps": "15 min", "rest": "N/A"}
            ],
            "rest_recovery": "Hydrate with electrolytes."
        },
        {
            "day": "Day 2",
            "focus": "Lower Body & HIIT intervals",
            "exercises": [
                {"exercise": "Goblet Squats", "sets": "3 sets", "reps": "12 reps", "rest": "60 sec"}
            ],
            "rest_recovery": "Leg elevation and stretching."
        },
        {
            "day": "Day 3",
            "focus": "Active Recovery & Mobility",
            "exercises": [
                {"exercise": "Light Walking", "sets": "1 session", "reps": "30 mins", "rest": "N/A"}
            ],
            "rest_recovery": "Foam rolling."
        },
        {
            "day": "Day 4",
            "focus": "Upper Pull & Rowing Cardio",
            "exercises": [
                {"exercise": "Rowing Machine", "sets": "3 intervals", "reps": "5 mins", "rest": "90 sec"}
            ],
            "rest_recovery": "Back stretching."
        },
        {
            "day": "Day 5",
            "focus": "Full Body Cardio Blast",
            "exercises": [
                {"exercise": "Jumping Rope & Bodyweight Circuit", "sets": "4 rounds", "reps": "1 min", "rest": "60 sec"}
            ],
            "rest_recovery": "Electrolytes and meal."
        },
        {
            "day": "Day 6",
            "focus": "Steady State Zone 2 Cardio",
            "exercises": [
                {"exercise": "Outdoor Jogging", "sets": "1 session", "reps": "35 mins", "rest": "N/A"}
            ],
            "rest_recovery": "Full body stretch."
        },
        {
            "day": "Day 7",
            "focus": "Full Rest Day",
            "exercises": [
                {"exercise": "Gentle Walk", "sets": "1 session", "reps": "15 mins", "rest": "N/A"}
            ],
            "rest_recovery": "Deep sleep and hydration."
        }
    ]
}


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


def test_generate_workout_plan_endpoint():
    """Test POST /generate-plan creates user and saves validated 7-day plan."""
    with patch("app.services.workout_service.generate_workout_plan_ai", return_value=MOCK_7_DAY_PLAN):
        payload = {
            "name": "Arun",
            "age": 21,
            "weight": 65.0,
            "goal": "Muscle Gain",
            "intensity": "Medium",
            "experience": "Beginner"
        }
        response = client.post("/generate-plan", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert "user_id" in data
        assert "plan_data" in data
        plan = data["plan_data"]
        assert len(plan["days"]) == 7
        assert plan["days"][0]["day"] == "Day 1"
        assert len(plan["days"][0]["exercises"]) > 0


def test_nutrition_tip_endpoint():
    """Test POST /nutrition-tip returns goal-specific tip and non-medical disclaimer."""
    with patch("app.services.nutrition_service.generate_nutrition_tip_ai", return_value="Include adequate protein and maintain good hydration."):
        payload = {
            "goal": "Muscle Gain",
            "name": "Arun"
        }
        response = client.post("/nutrition-tip", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["goal"] == "Muscle Gain"
        assert "protein" in data["tip"].lower()
        assert "medical" in data["disclaimer"].lower()


def test_feedback_system_endpoint():
    """Test POST /feedback adjusts existing plan with Gemini and persists changes."""
    # First generate a user & plan
    with patch("app.services.workout_service.generate_workout_plan_ai", return_value=MOCK_7_DAY_PLAN):
        plan_res = client.post("/generate-plan", json={
            "name": "Elena",
            "age": 28,
            "weight": 62,
            "goal": "General Fitness",
            "intensity": "Medium",
            "experience": "Intermediate"
        })
        assert plan_res.status_code == 201
        plan_data = plan_res.json()
        user_id = plan_data["user_id"]
        plan_id = plan_data["id"]

    # Now submit feedback
    with patch("app.routes.feedback.regenerate_workout_plan_ai", return_value=MOCK_UPDATED_PLAN):
        fb_payload = {
            "user_id": user_id,
            "plan_id": plan_id,
            "feedback_text": "I want more cardio in the weekly schedule."
        }
        fb_res = client.post("/feedback", json=fb_payload)
        assert fb_res.status_code == 201
        fb_data = fb_res.json()
        assert fb_data["user_id"] == user_id
        assert fb_data["plan_id"] == plan_id
        assert fb_data["feedback_text"] == "I want more cardio in the weekly schedule."
        assert len(fb_data["updated_plan"]["days"]) == 7


def test_get_workout_history():
    """Test GET /plans/{user_id} retrieves list of historical plans."""
    with patch("app.services.workout_service.generate_workout_plan_ai", return_value=MOCK_7_DAY_PLAN):
        # Create user & plan
        plan_res = client.post("/generate-plan", json={
            "name": "Marcus",
            "age": 32,
            "weight": 80,
            "goal": "Strength",
            "intensity": "High",
            "experience": "Advanced"
        })
        user_id = plan_res.json()["user_id"]

        history_res = client.get(f"/plans/{user_id}")
        assert history_res.status_code == 200
        history = history_res.json()
        assert isinstance(history, list)
        assert len(history) >= 1
        assert history[0]["user_id"] == user_id
