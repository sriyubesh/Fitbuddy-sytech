# FitBuddy - AI-Powered Fitness Planning Web Application

FitBuddy is an intelligent, full-stack fitness application that analyzes individual user physical parameters and leverages Google's Gemini AI to craft personalized 7-day workout plans, goal-specific nutrition/recovery guidance, and responsive plan modifications based on direct user feedback.

---

## 1. Project Description

FitBuddy eliminates generic, one-size-fits-all training templates. By collecting key biometric and preference markers (Age, Weight, Goal, Training Intensity, and Experience Level), FitBuddy prompts Google's Gemini AI with strict exercise physiology and safety constraints to construct a balanced, progressive 7-day workout schedule.

Users can iteratively review and customize their routines using natural language feedback (e.g., *"Focus more on legs"*, *"I need more rest days"*, *"Add cardio finishers"*). FitBuddy retains workout history in an SQLite database using SQLAlchemy ORM and regenerates updated routines seamlessly.

---

## 2. Features

- **Personalized 7-Day Workout Plans**: Daily focus, exercises, sets, reps/duration, and day-specific recovery protocols.
- **Biometric & Experience Calibration**: Built with strict Pydantic validation (safe age and weight limits, standardized fitness goals).
- **Targeted Nutrition & Recovery Advice**: Concise, goal-calibrated fueling and recovery guidance with safe wellness disclaimers (no medical claims).
- **Interactive Feedback & Plan Regeneration**: Adjust workouts via natural language feedback; Gemini revises the 7-day schedule while preserving physiological safety.
- **Workout Plan History**: Retrieve and switch between past workout plan revisions anytime.
- **Modern Responsive Dashboard**: High-contrast, mobile-friendly interface with loading indicators, error handling, quick feedback chips, and toast notifications.
- **Automated Test Suite**: Comprehensive pytest coverage for health checks, input validation, plan generation, nutrition tips, and feedback iteration.

---

## 3. Technology Stack

- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy, SQLite, Uvicorn, python-dotenv
- **AI Integration**: Google Gemini API (`gemini-3.8-flash`) with structured JSON schema enforcement
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (responsive, zero unnecessary heavy frameworks)
- **Testing**: pytest, HTTPX / FastAPI TestClient

---

## 4. Folder Structure

```text
FitBuddy/
│
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI application & route mounting
│   ├── database.py              # SQLite & SQLAlchemy engine setup
│   │
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py              # User entity
│   │   ├── workout.py           # WorkoutPlan entity
│   │   └── feedback.py          # Feedback entity
│   │
│   ├── schemas/                 # Pydantic validation schemas
│   │   ├── __init__.py
│   │   ├── user.py              # User validation & enums
│   │   ├── workout.py           # 7-day plan schemas & nutrition schemas
│   │   └── feedback.py          # Feedback & revision schemas
│   │
│   ├── routes/                  # FastAPI API route handlers
│   │   ├── __init__.py
│   │   ├── users.py             # POST /users, GET /users/{id}
│   │   ├── workout.py           # POST /generate-plan, POST /nutrition-tip, GET /plans/{id}
│   │   └── feedback.py          # POST /feedback
│   │
│   └── services/                # Business & AI service layer
│       ├── __init__.py
│       ├── gemini.py            # Gemini API client & prompt engineering
│       ├── workout_service.py   # Plan generation & persistence
│       └── nutrition_service.py # Nutrition & recovery tip generator
│
├── frontend/
│   ├── index.html               # Semantic HTML5 dashboard
│   ├── style.css                # Modern athletic fitness styling
│   └── script.js                # Vanilla JavaScript API controller
│
├── tests/
│   ├── __init__.py
│   ├── test_users.py            # User validation & health checks
│   └── test_workout.py          # Plan generation, nutrition, & feedback tests
│
├── .env                         # Local environment variables
├── .env.example                 # Sample environment template
├── .gitignore                   # Ignored files & virtual environments
├── requirements.txt             # Python dependencies
└── README.md                    # Project documentation
```

---

## 5. Installation

### Prerequisites
- Python 3.11+
- Git

### Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd FitBuddy
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate    # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

---

## 6. Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Populate the `.env` file with your credentials:

```ini
# Google Gemini API key (Obtain from Google AI Studio: https://aistudio.google.com/)
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Server Host & Port
HOST=0.0.0.0
PORT=8000

# SQLite Database Location
DATABASE_URL=sqlite:///./fitbuddy.db
```

*Note: Never commit your `.env` file containing secrets to version control.*

---

## 7. How to Run the Backend

To launch the FastAPI backend server with auto-reload:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at: `http://localhost:8000`  
Interactive Swagger documentation is available at: `http://localhost:8000/docs`  
ReDoc is available at: `http://localhost:8000/redoc`

---

## 8. How to Open the Frontend

The FastAPI server automatically serves the static frontend at the root route (`http://localhost:8000/`).

Alternatively, if you prefer to serve the static frontend with an independent HTTP server:
```bash
cd frontend
python3 -m http.server 3000
```
Open your browser and navigate to `http://localhost:3000`.

---

## 9. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System health check (`{"status": "ok"}`) |
| `POST` | `/users` | Create and validate a user profile in SQLite |
| `GET` | `/users/{user_id}` | Retrieve profile for a specific user ID |
| `POST` | `/generate-plan` | Generate personalized 7-day plan with Gemini |
| `POST` | `/nutrition-tip` | Generate non-medical nutrition & recovery tip |
| `POST` | `/feedback` | Submit feedback and regenerate plan with Gemini |
| `GET` | `/plans/{user_id}` | Fetch all previous workout plans for a user |

---

## 10. Example API Requests

### 1. Health Check
```bash
curl -X GET http://localhost:8000/health
```
**Response:**
```json
{
  "status": "ok"
}
```

### 2. Create User
```bash
curl -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Arun",
    "age": 21,
    "weight": 65,
    "goal": "Muscle Gain",
    "intensity": "Medium",
    "experience": "Beginner"
  }'
```
**Response (201 Created):**
```json
{
  "id": 1,
  "name": "Arun",
  "age": 21,
  "weight": 65.0,
  "goal": "Muscle Gain",
  "intensity": "Medium",
  "experience": "Beginner",
  "created_at": "2026-09-28T02:30:00"
}
```

### 3. Generate Workout Plan
```bash
curl -X POST http://localhost:8000/generate-plan \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1
  }'
```

### 4. Nutrition / Recovery Tip
```bash
curl -X POST http://localhost:8000/nutrition-tip \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Muscle Gain",
    "name": "Arun"
  }'
```

### 5. Submit Feedback
```bash
curl -X POST http://localhost:8000/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "plan_id": 1,
    "feedback_text": "I want more cardio and focus on core strength."
  }'
```

### 6. Get Plan History
```bash
curl -X GET http://localhost:8000/plans/1
```

---

## 11. Testing Instructions

Run the automated test suite using `pytest`:

```bash
# Run all tests
pytest

# Run tests with detailed verbose output
pytest -v

# Run with test coverage report
pytest --cov=app tests/
```

The test suite validates:
- User creation and normalization
- Validation rules (age boundaries, weight boundaries, blank fields)
- 7-day workout plan structural validity
- Non-medical nutrition tip format and disclaimers
- Feedback ingestion and regeneration pipeline
- Database relationships and cascade integrity

---

## 12. Deployment Instructions

### Docker Deployment
Create a `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
Build and run:
```bash
docker build -t fitbuddy-app .
docker run -p 8000:8000 --env-file .env fitbuddy-app
```

### Cloud Run / PaaS Deployment
1. Set the environment variable `GEMINI_API_KEY` in the container service console.
2. Ensure the startup command executes: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
