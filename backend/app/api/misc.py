"""
Highlights, Tags, Search, and Stats API Routers
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from datetime import datetime, timedelta
from app.db.database import get_db
from app.models.models import (
    Meeting, Highlight, Tag, MeetingTag, TranscriptSegment,
    Transcript, Summary, ActionItem, generate_uuid, now
)
from app.schemas.schemas import HighlightCreate, ApiResponse, TagCreate
from app.config import settings

# ── Highlights Router ──────────────────────────────────────────────────────
highlights_router = APIRouter(prefix="/highlights", tags=["highlights"])

# ── Tags Router ────────────────────────────────────────────────────────────
tags_router = APIRouter(prefix="/tags", tags=["tags"])

# ── Search Router ──────────────────────────────────────────────────────────
search_router = APIRouter(prefix="/search", tags=["search"])

# ── Stats Router ───────────────────────────────────────────────────────────
stats_router = APIRouter(prefix="/stats", tags=["stats"])


def _get_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    return x_user_id or settings.DEFAULT_USER_ID


# ── Highlights ─────────────────────────────────────────────────────────────

@highlights_router.post("", response_model=ApiResponse, status_code=201)
async def create_highlight(
    body: HighlightCreate,
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a highlight on a transcript segment."""
    # Verify segment exists
    seg_result = await db.execute(
        select(TranscriptSegment).where(TranscriptSegment.id == body.segment_id)
    )
    if not seg_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Segment not found")

    highlight = Highlight(
        id=generate_uuid(),
        segment_id=body.segment_id,
        meeting_id=body.meeting_id,
        note=body.note,
        color=body.color,
    )
    db.add(highlight)
    await db.commit()
    await db.refresh(highlight)

    return ApiResponse(data={
        "id": highlight.id,
        "segment_id": highlight.segment_id,
        "meeting_id": highlight.meeting_id,
        "note": highlight.note,
        "color": highlight.color,
        "created_at": highlight.created_at,
    })


@highlights_router.delete("/{highlight_id}", status_code=204)
async def delete_highlight(
    highlight_id: str,
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete a highlight."""
    result = await db.execute(select(Highlight).where(Highlight.id == highlight_id))
    highlight = result.scalar_one_or_none()
    if not highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")

    await db.delete(highlight)
    await db.commit()


# ── Tags ───────────────────────────────────────────────────────────────────

@tags_router.get("", response_model=ApiResponse)
async def list_tags(db: AsyncSession = Depends(get_db)):
    """List all available tags."""
    result = await db.execute(select(Tag).order_by(Tag.name))
    tags = result.scalars().all()
    return ApiResponse(data=[{"id": t.id, "name": t.name, "color": t.color} for t in tags])


@tags_router.post("", response_model=ApiResponse, status_code=201)
async def create_tag(body: TagCreate, db: AsyncSession = Depends(get_db)):
    """Create a new tag."""
    existing = await db.execute(select(Tag).where(Tag.name == body.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Tag already exists")

    tag = Tag(id=generate_uuid(), name=body.name, color=body.color)
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return ApiResponse(data={"id": tag.id, "name": tag.name, "color": tag.color})


@tags_router.post("/meetings/{meeting_id}/tags/{tag_id}", response_model=ApiResponse, status_code=201)
async def add_tag_to_meeting(
    meeting_id: str,
    tag_id: str,
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Add a tag to a meeting."""
    meeting_result = await db.execute(
        select(Meeting).where(Meeting.id == meeting_id, Meeting.user_id == user_id)
    )
    if not meeting_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Meeting not found")

    tag_result = await db.execute(select(Tag).where(Tag.id == tag_id))
    if not tag_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Tag not found")

    # Check if already exists
    existing = await db.execute(
        select(MeetingTag).where(MeetingTag.meeting_id == meeting_id, MeetingTag.tag_id == tag_id)
    )
    if existing.scalar_one_or_none():
        return ApiResponse(data={"message": "Tag already assigned"})

    meeting_tag = MeetingTag(meeting_id=meeting_id, tag_id=tag_id)
    db.add(meeting_tag)
    await db.commit()
    return ApiResponse(data={"message": "Tag added successfully"})


@tags_router.delete("/meetings/{meeting_id}/tags/{tag_id}", status_code=204)
async def remove_tag_from_meeting(
    meeting_id: str,
    tag_id: str,
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Remove a tag from a meeting."""
    result = await db.execute(
        select(MeetingTag).where(MeetingTag.meeting_id == meeting_id, MeetingTag.tag_id == tag_id)
    )
    mt = result.scalar_one_or_none()
    if not mt:
        raise HTTPException(status_code=404, detail="Tag not found on this meeting")

    await db.delete(mt)
    await db.commit()


# ── Search ─────────────────────────────────────────────────────────────────

@search_router.get("", response_model=ApiResponse)
async def global_search(
    q: str = Query(..., min_length=2),
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Search across meeting titles, transcripts, and action items."""
    # Get user's meeting IDs first
    meetings_result = await db.execute(
        select(Meeting).where(Meeting.user_id == user_id, Meeting.title.ilike(f"%{q}%"))
        .order_by(Meeting.date.desc()).limit(10)
    )
    matched_meetings = meetings_result.scalars().all()

    # Search transcript segments
    user_meeting_ids_result = await db.execute(
        select(Meeting.id).where(Meeting.user_id == user_id)
    )
    user_meeting_ids = [row[0] for row in user_meeting_ids_result.all()]

    transcript_matches = []
    if user_meeting_ids:
        transcripts_result = await db.execute(
            select(Transcript.id, Transcript.meeting_id)
            .where(Transcript.meeting_id.in_(user_meeting_ids))
        )
        transcript_map = {row[0]: row[1] for row in transcripts_result.all()}

        if transcript_map:
            segments_result = await db.execute(
                select(TranscriptSegment)
                .where(
                    TranscriptSegment.transcript_id.in_(list(transcript_map.keys())),
                    TranscriptSegment.text.ilike(f"%{q}%")
                )
                .limit(20)
            )
            segments = segments_result.scalars().all()

            # Fetch meeting titles for context
            meeting_titles_result = await db.execute(
                select(Meeting.id, Meeting.title, Meeting.date)
                .where(Meeting.id.in_(user_meeting_ids))
            )
            meeting_info = {row[0]: {"title": row[1], "date": row[2]} for row in meeting_titles_result.all()}

            for seg in segments:
                m_id = transcript_map.get(seg.transcript_id)
                m_info = meeting_info.get(m_id, {})
                transcript_matches.append({
                    "type": "transcript",
                    "id": seg.id,
                    "meeting_id": m_id,
                    "title": m_info.get("title", ""),
                    "snippet": seg.text[:200],
                    "date": m_info.get("date"),
                    "speaker_name": seg.speaker_name,
                    "start_time": seg.start_time,
                })

    # Search action items
    action_items_result = await db.execute(
        select(ActionItem, Meeting.title, Meeting.date)
        .join(Meeting, ActionItem.meeting_id == Meeting.id)
        .where(
            Meeting.user_id == user_id,
            ActionItem.text.ilike(f"%{q}%")
        )
        .limit(10)
    )
    action_items_data = []
    for row in action_items_result.all():
        action, m_title, m_date = row
        action_items_data.append({
            "type": "action_item",
            "id": action.id,
            "meeting_id": action.meeting_id,
            "title": m_title,
            "snippet": action.text,
            "date": m_date,
            "status": action.status,
            "priority": action.priority,
        })

    return ApiResponse(data={
        "meetings": [
            {
                "type": "meeting",
                "id": m.id,
                "meeting_id": m.id,
                "title": m.title,
                "date": m.date,
                "snippet": None,
            }
            for m in matched_meetings
        ],
        "transcripts": transcript_matches,
        "action_items": action_items_data,
    })


# ── Stats ──────────────────────────────────────────────────────────────────

@stats_router.get("", response_model=ApiResponse)
async def get_stats(
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Return dashboard stats for the user."""
    # Total meetings
    total_meetings_result = await db.execute(
        select(func.count(Meeting.id)).where(Meeting.user_id == user_id)
    )
    total_meetings = total_meetings_result.scalar() or 0

    # Total duration
    total_duration_result = await db.execute(
        select(func.sum(Meeting.duration_secs)).where(Meeting.user_id == user_id)
    )
    total_duration_secs = total_duration_result.scalar() or 0
    total_duration_mins = round(total_duration_secs / 60, 1)

    # Total action items
    user_meeting_ids_result = await db.execute(
        select(Meeting.id).where(Meeting.user_id == user_id)
    )
    user_meeting_ids = [row[0] for row in user_meeting_ids_result.all()]

    total_action_items = 0
    this_week_count = 0
    if user_meeting_ids:
        action_count_result = await db.execute(
            select(func.count(ActionItem.id)).where(ActionItem.meeting_id.in_(user_meeting_ids))
        )
        total_action_items = action_count_result.scalar() or 0

        # This week meetings
        week_ago = datetime.utcnow() - timedelta(days=7)
        this_week_result = await db.execute(
            select(func.count(Meeting.id)).where(
                Meeting.user_id == user_id,
                Meeting.date >= week_ago
            )
        )
        this_week_count = this_week_result.scalar() or 0

    return ApiResponse(data={
        "total_meetings": total_meetings,
        "total_duration_mins": total_duration_mins,
        "total_action_items": total_action_items,
        "this_week_count": this_week_count,
    })
