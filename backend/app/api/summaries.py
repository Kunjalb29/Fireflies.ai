"""
Summaries API Router
Handles AI summary retrieval and generation/regeneration.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import Meeting, Summary
from app.schemas.schemas import ApiResponse
from app.services.ai_service import generate_summary
from app.config import settings

router = APIRouter(tags=["summaries"])


def _get_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    return x_user_id or settings.DEFAULT_USER_ID


@router.get("/meetings/{meeting_id}/summary", response_model=ApiResponse)
async def get_summary(
    meeting_id: str,
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Return the existing summary for a meeting."""
    meeting_result = await db.execute(
        select(Meeting).where(Meeting.id == meeting_id, Meeting.user_id == user_id)
    )
    if not meeting_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Meeting not found")

    result = await db.execute(
        select(Summary).where(Summary.meeting_id == meeting_id)
    )
    summary = result.scalar_one_or_none()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found. Use POST /generate to create one.")

    return ApiResponse(data={
        "id": summary.id,
        "meeting_id": summary.meeting_id,
        "overview": summary.overview,
        "key_points": summary.key_points,
        "chapters": summary.chapters,
        "sentiment": summary.sentiment,
        "generated_at": summary.generated_at,
    })


@router.post("/meetings/{meeting_id}/summary/generate", response_model=ApiResponse)
async def generate_meeting_summary(
    meeting_id: str,
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate or regenerate AI summary for a meeting.
    Uses Anthropic Claude if API key is set, otherwise returns mock data.
    """
    meeting_result = await db.execute(
        select(Meeting).where(Meeting.id == meeting_id, Meeting.user_id == user_id)
    )
    if not meeting_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Meeting not found")

    try:
        summary = await generate_summary(meeting_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")

    return ApiResponse(data={
        "id": summary.id,
        "meeting_id": summary.meeting_id,
        "overview": summary.overview,
        "key_points": summary.key_points,
        "chapters": summary.chapters,
        "sentiment": summary.sentiment,
        "generated_at": summary.generated_at,
    })
