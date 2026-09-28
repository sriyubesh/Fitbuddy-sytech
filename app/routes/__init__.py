from app.routes.users import router as users_router
from app.routes.workout import router as workout_router
from app.routes.feedback import router as feedback_router

__all__ = ["users_router", "workout_router", "feedback_router"]
