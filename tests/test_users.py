"""
Tests for User Profile creation, input validation, and health check.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    Base.metadata.create_all(bind=engine)
    yield


def test_health_check():
    """Verify GET /health returns 200 and status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_user_success():
    """Test valid user creation with standardized inputs."""
    payload = {
        "name": "Arun",
        "age": 21,
        "weight": 65.0,
        "goal": "Muscle Gain",
        "intensity": "Medium",
        "experience": "Beginner",
    }
    response = client.post("/users", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Arun"
    assert data["age"] == 21
    assert data["weight"] == 65.0
    assert data["goal"] == "Muscle Gain"
    assert data["intensity"] == "Medium"
    assert data["experience"] == "Beginner"
    assert "id" in data
    assert "created_at" in data


def test_create_user_case_insensitive_enums():
    """Test user creation handles lower-case strings cleanly."""
    payload = {
        "name": "Sarah Connor",
        "age": 29,
        "weight": 58.5,
        "goal": "weight loss",
        "intensity": "high",
        "experience": "intermediate",
    }
    response = client.post("/users", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["goal"] == "Weight Loss"
    assert data["intensity"] == "High"
    assert data["experience"] == "Intermediate"


def test_invalid_age_too_young():
    """Do not accept invalid age values (under 12)."""
    payload = {
        "name": "Too Young",
        "age": 10,
        "weight": 50,
        "goal": "General Fitness",
        "intensity": "Low",
        "experience": "Beginner",
    }
    response = client.post("/users", json=payload)
    assert response.status_code == 422


def test_invalid_age_too_old():
    """Do not accept invalid age values (> 120)."""
    payload = {
        "name": "Too Old",
        "age": 150,
        "weight": 70,
        "goal": "General Fitness",
        "intensity": "Low",
        "experience": "Beginner",
    }
    response = client.post("/users", json=payload)
    assert response.status_code == 422


def test_invalid_weight():
    """Do not accept negative or unrealistic weights."""
    payload = {
        "name": "Invalid Weight",
        "age": 25,
        "weight": 10.0,  # Below minimum 20 kg
        "goal": "Strength",
        "intensity": "Medium",
        "experience": "Beginner",
    }
    response = client.post("/users", json=payload)
    assert response.status_code == 422


def test_invalid_goal():
    """Reject unrecognized fitness goals."""
    payload = {
        "name": "Tester",
        "age": 25,
        "weight": 70,
        "goal": "Fly To The Moon",
        "intensity": "Medium",
        "experience": "Beginner",
    }
    response = client.post("/users", json=payload)
    assert response.status_code == 422


def test_blank_name():
    """Reject empty name string."""
    payload = {
        "name": "   ",
        "age": 25,
        "weight": 70,
        "goal": "Strength",
        "intensity": "Medium",
        "experience": "Beginner",
    }
    response = client.post("/users", json=payload)
    assert response.status_code == 422
