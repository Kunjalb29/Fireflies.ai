"""
Meetings API Router
Handles CRUD operations for meetings with filtering, search, and pagination.
"""
import json
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, desc, asc
from app.db.database import get_db
from app.models.models import Meeting, Transcript, TranscriptSegment, Summary, ActionItem, Tag, MeetingTag, User, generate_uuid, now
from app.schemas.schemas import (
    MeetingCreate, MeetingUpdate, MeetingListOut, MeetingDetailOut,
    ApiResponse, PaginatedMeta, TagOut, ActionItemOut, TranscriptOut, SummaryOut
)
from app.config import settings

router = APIRouter(prefix="/meetings", tags=["meetings"])


def _get_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    """Get user ID from header or use default. Replace with JWT in production."""
    return x_user_id or settings.DEFAULT_USER_ID


def _format_meeting_list(meeting: Meeting, tags: list, summary_overview: Optional[str], action_count: int) -> dict:
    return {
        "id": meeting.id,
        "title": meeting.title,
        "date": meeting.date,
        "duration_secs": meeting.duration_secs,
        "status": meeting.status,
        "participants": meeting.participants,
        "audio_url": meeting.audio_url,
        "created_at": meeting.created_at,
        "updated_at": meeting.updated_at,
        "tags": tags,
        "summary_overview": summary_overview,
        "action_items_count": action_count,
    }


@router.get("", response_model=ApiResponse)
async def list_meetings(
    search: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    sort: str = Query("recent", regex="^(recent|oldest|longest)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List meetings with optional filtering, search, and pagination."""
    base_query = select(Meeting).where(Meeting.user_id == user_id)

    # Apply search filter
    if search:
        base_query = base_query.where(Meeting.title.ilike(f"%{search}%"))

    # Apply date range filters
    if date_from:
        base_query = base_query.where(Meeting.date >= date_from)
    if date_to:
        base_query = base_query.where(Meeting.date <= date_to)

    # Apply tag filter
    if tag:
        tag_subquery = (
            select(MeetingTag.meeting_id)
            .join(Tag, MeetingTag.tag_id == Tag.id)
            .where(Tag.name.ilike(f"%{tag}%"))
        )
        base_query = base_query.where(Meeting.id.in_(tag_subquery))

    # Apply sorting
    if sort == "recent":
        base_query = base_query.order_by(desc(Meeting.date))
    elif sort == "oldest":
        base_query = base_query.order_by(asc(Meeting.date))
    elif sort == "longest":
        base_query = base_query.order_by(desc(Meeting.duration_secs))

    # Count total
    count_result = await db.execute(
        select(func.count()).select_from(base_query.subquery())
    )
    total = count_result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * limit
    paginated_query = base_query.offset(offset).limit(limit)
    result = await db.execute(paginated_query)
    meetings = result.scalars().all()

    # Build response with tags and summary snippets
    meeting_list = []
    for m in meetings:
        # Fetch tags
        tags_result = await db.execute(
            select(Tag)
            .join(MeetingTag, Tag.id == MeetingTag.tag_id)
            .where(MeetingTag.meeting_id == m.id)
        )
        tags = [{"id": t.id, "name": t.name, "color": t.color} for t in tags_result.scalars().all()]

        # Fetch summary overview
        summary_result = await db.execute(
            select(Summary.overview).where(Summary.meeting_id == m.id)
        )
        overview = summary_result.scalar_one_or_none()

        # Count action items
        count_result = await db.execute(
            select(func.count(ActionItem.id)).where(ActionItem.meeting_id == m.id)
        )
        action_count = count_result.scalar() or 0

        meeting_list.append(_format_meeting_list(m, tags, overview, action_count))

    return ApiResponse(
        data=meeting_list,
        meta={
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": max(1, (total + limit - 1) // limit),
        }
    )


@router.post("", response_model=ApiResponse, status_code=201)
async def create_meeting(
    title: str = Form(...),
    date: str = Form(...),
    duration_secs: int = Form(0),
    participants: str = Form("[]"),
    transcript_text: Optional[str] = Form(None),
    transcript_file: Optional[UploadFile] = File(None),
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a new meeting with optional transcript."""
    # Parse participants JSON
    try:
        participants_list = json.loads(participants)
    except (json.JSONDecodeError, TypeError):
        participants_list = []

    # Parse date
    try:
        meeting_date = datetime.fromisoformat(date.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid date format")

    # Create meeting
    meeting = Meeting(
        id=generate_uuid(),
        user_id=user_id,
        title=title,
        date=meeting_date,
        duration_secs=duration_secs,
        status="processing",
        participants=participants_list,
    )
    db.add(meeting)
    await db.flush()

    # Handle transcript
    raw_text = transcript_text
    if not raw_text and transcript_file:
        content = await transcript_file.read()
        raw_text = content.decode("utf-8", errors="replace")

    if raw_text:
        transcript = Transcript(
            id=generate_uuid(),
            meeting_id=meeting.id,
            raw_text=raw_text,
            word_count=len(raw_text.split()),
        )
        db.add(transcript)
        await db.flush()

        # Parse segments (format: [HH:MM] Speaker: text)
        segments = _parse_transcript_segments(raw_text, transcript.id)
        for seg in segments:
            db.add(seg)

        meeting.status = "processed"

    await db.commit()
    await db.refresh(meeting)

    return ApiResponse(data={"id": meeting.id, "status": meeting.status})


def _parse_transcript_segments(raw_text: str, transcript_id: str) -> list:
    """Parse transcript text into segments. Handles common formats."""
    import re
    segments = []
    # Pattern: [00:00] Speaker Name: text
    pattern = re.compile(r'\[(\d+:\d+(?::\d+)?)\]\s+([^:]+):\s+(.+?)(?=\[\d|\Z)', re.DOTALL)
    matches = pattern.findall(raw_text)

    for i, (time_str, speaker, text) in enumerate(matches):
        # Convert timestamp to seconds
        parts = time_str.split(":")
        if len(parts) == 2:
            start_secs = int(parts[0]) * 60 + int(parts[1])
        elif len(parts) == 3:
            start_secs = int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
        else:
            start_secs = 0

        seg = TranscriptSegment(
            id=generate_uuid(),
            transcript_id=transcript_id,
            speaker_name=speaker.strip(),
            start_time=float(start_secs),
            end_time=float(start_secs + 60),  # Estimate if not provided
            text=text.strip(),
            segment_index=i,
        )
        segments.append(seg)

    return segments


@router.get("/{meeting_id}", response_model=ApiResponse)
async def get_meeting(
    meeting_id: str,
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get full meeting detail including transcript, summary, and action items."""
    result = await db.execute(
        select(Meeting).where(Meeting.id == meeting_id, Meeting.user_id == user_id)
    )
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Fetch all related data
    transcript_result = await db.execute(
        select(Transcript).where(Transcript.meeting_id == meeting_id)
    )
    transcript = transcript_result.scalar_one_or_none()

    transcript_data = None
    if transcript:
        segments_result = await db.execute(
            select(TranscriptSegment)
            .where(TranscriptSegment.transcript_id == transcript.id)
            .order_by(TranscriptSegment.segment_index)
        )
        segments = segments_result.scalars().all()
        transcript_data = {
            "id": transcript.id,
            "meeting_id": transcript.meeting_id,
            "raw_text": transcript.raw_text,
            "word_count": transcript.word_count,
            "segments": [
                {
                    "id": s.id,
                    "transcript_id": s.transcript_id,
                    "speaker_name": s.speaker_name,
                    "speaker_email": s.speaker_email,
                    "start_time": s.start_time,
                    "end_time": s.end_time,
                    "text": s.text,
                    "segment_index": s.segment_index,
                    "highlights": [
                        {"id": h.id, "segment_id": h.segment_id, "meeting_id": h.meeting_id,
                         "note": h.note, "color": h.color, "created_at": h.created_at}
                        for h in s.highlights
                    ]
                }
                for s in segments
            ]
        }

    summary_result = await db.execute(
        select(Summary).where(Summary.meeting_id == meeting_id)
    )
    summary = summary_result.scalar_one_or_none()

    summary_data = None
    if summary:
        summary_data = {
            "id": summary.id,
            "meeting_id": summary.meeting_id,
            "overview": summary.overview,
            "key_points": summary.key_points,
            "chapters": summary.chapters,
            "sentiment": summary.sentiment,
            "generated_at": summary.generated_at,
        }

    action_items_result = await db.execute(
        select(ActionItem).where(ActionItem.meeting_id == meeting_id).order_by(ActionItem.created_at)
    )
    action_items = action_items_result.scalars().all()

    tags_result = await db.execute(
        select(Tag).join(MeetingTag, Tag.id == MeetingTag.tag_id).where(MeetingTag.meeting_id == meeting_id)
    )
    tags = [{"id": t.id, "name": t.name, "color": t.color} for t in tags_result.scalars().all()]

    return ApiResponse(data={
        "id": meeting.id,
        "title": meeting.title,
        "date": meeting.date,
        "duration_secs": meeting.duration_secs,
        "status": meeting.status,
        "participants": meeting.participants,
        "audio_url": meeting.audio_url,
        "created_at": meeting.created_at,
        "updated_at": meeting.updated_at,
        "tags": tags,
        "transcript": transcript_data,
        "summary": summary_data,
        "action_items": [
            {
                "id": a.id,
                "meeting_id": a.meeting_id,
                "text": a.text,
                "assignee": a.assignee,
                "due_date": a.due_date,
                "priority": a.priority,
                "status": a.status,
                "created_at": a.created_at,
                "updated_at": a.updated_at,
            }
            for a in action_items
        ],
    })


@router.patch("/{meeting_id}", response_model=ApiResponse)
async def update_meeting(
    meeting_id: str,
    body: MeetingUpdate,
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Update meeting title and/or participants."""
    result = await db.execute(
        select(Meeting).where(Meeting.id == meeting_id, Meeting.user_id == user_id)
    )
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if body.title is not None:
        meeting.title = body.title
    if body.participants is not None:
        meeting.participants = body.participants
    if body.status is not None:
        meeting.status = body.status

    meeting.updated_at = now()
    await db.commit()
    await db.refresh(meeting)
    return ApiResponse(data={"id": meeting.id, "title": meeting.title})


@router.delete("/{meeting_id}", status_code=204)
async def delete_meeting(
    meeting_id: str,
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete a meeting and all its cascaded records."""
    result = await db.execute(
        select(Meeting).where(Meeting.id == meeting_id, Meeting.user_id == user_id)
    )
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    await db.delete(meeting)
    await db.commit()
