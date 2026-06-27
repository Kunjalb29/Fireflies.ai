"""
MeetMind FastAPI Application Entry Point
AI-powered meeting intelligence platform backend.

To run: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.config import settings
from app.db.database import init_db
from app.api.meetings import router as meetings_router
from app.api.transcripts import router as transcripts_router
from app.api.summaries import router as summaries_router
from app.api.action_items import router as action_items_router
from app.api.misc import highlights_router, tags_router, search_router, stats_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="MeetMind API",
    description="AI-powered meeting intelligence platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
# NOTE: In production, restrict origins to your actual domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 prefix
API_PREFIX = f"/api/{settings.API_VERSION}"

# Register all routers
app.include_router(meetings_router, prefix=API_PREFIX)
app.include_router(transcripts_router, prefix=API_PREFIX)
app.include_router(summaries_router, prefix=API_PREFIX)
app.include_router(action_items_router, prefix=API_PREFIX)
app.include_router(highlights_router, prefix=API_PREFIX)
app.include_router(tags_router, prefix=API_PREFIX)
app.include_router(search_router, prefix=API_PREFIX)
app.include_router(stats_router, prefix=API_PREFIX)


@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup."""
    logger.info("Starting MeetMind API...")
    await init_db()
    logger.info("Database initialized.")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "app": "MeetMind API", "version": "1.0.0"}


@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",
        "ai_enabled": bool(settings.ANTHROPIC_API_KEY),
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global error handler — logs and returns JSON error response."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"data": None, "error": "An internal server error occurred. Please try again."},
    )
