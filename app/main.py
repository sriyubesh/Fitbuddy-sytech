"""
Main FastAPI application entry point for FitBuddy.
Configures routes, database schemas, CORS, and static file serving.
"""

import os
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from dotenv import load_dotenv

from app.database import engine, Base
from app.routes.users import router as users_router
from app.routes.workout import router as workout_router
from app.routes.feedback import router as feedback_router

load_dotenv()

# Initialize SQLite database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FitBuddy API",
    description="AI-Powered Personalized Fitness Planning API powered by Google Gemini",
    version="1.0.0",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(users_router)
app.include_router(workout_router)
app.include_router(feedback_router)


@app.get(
    "/health",
    tags=["System"],
    summary="Health check endpoint"
)
def health_check():
    """Returns application health status."""
    return {"status": "ok"}


# Mount frontend directory for static assets and HTML UI
frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

    @app.get("/", include_in_schema=False)
    def serve_frontend_index():
        index_file = frontend_dir / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"message": "FitBuddy API is running. Access /docs for API documentation."}


# Global Exception Handler for unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"An internal server error occurred: {str(exc)}"}
    )
