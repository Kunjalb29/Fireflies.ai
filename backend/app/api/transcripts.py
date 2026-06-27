"""
Transcripts API Router
Handles transcript retrieval and search within transcripts.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import Meeting, Transcript, TranscriptSegment, Highlight
from app.schemas.schemas import ApiResponse
from app.config import settings

router = APIRouter(tags=["transcripts"])


def _get_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    return x_user_id or settings.DEFAULT_USER_ID


@router.get("/meetings/{meeting_id}/transcript", response_model=ApiResponse)
async def get_transcript(
    meeting_id: str,
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get full transcript with all segments for a meeting."""
    # Verify meeting ownership
    meeting_result = await db.execute(
        select(Meeting).where(Meeting.id == meeting_id, Meeting.user_id == user_id)
    )
    if not meeting_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Meeting not found")

    transcript_result = await db.execute(
        select(Transcript).where(Transcript.meeting_id == meeting_id)
    )
    transcript = transcript_result.scalar_one_or_none()
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")

    segments_result = await db.execute(
        select(TranscriptSegment)
        .where(TranscriptSegment.transcript_id == transcript.id)
        .order_by(TranscriptSegment.segment_index)
    )
    segments = segments_result.scalars().all()

    segments_data = []
    for s in segments:
        highlights_data = [
            {
                "id": h.id,
                "segment_id": h.segment_id,
                "meeting_id": h.meeting_id,
                "note": h.note,
                "color": h.color,
                "created_at": h.created_at,
            }
            for h in s.highlights
        ]
        segments_data.append({
            "id": s.id,
            "transcript_id": s.transcript_id,
            "speaker_name": s.speaker_name,
            "speaker_email": s.speaker_email,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "text": s.text,
            "segment_index": s.segment_index,
            "highlights": highlights_data,
        })

    return ApiResponse(data={
        "id": transcript.id,
        "meeting_id": transcript.meeting_id,
        "raw_text": transcript.raw_text,
        "word_count": transcript.word_count,
        "segments": segments_data,
    })


@router.get("/meetings/{meeting_id}/transcript/search", response_model=ApiResponse)
async def search_transcript(
    meeting_id: str,
    q: str = Query(..., min_length=1),
    user_id: str = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Search within a meeting's transcript. Returns matching segment IDs and positions."""
    meeting_result = await db.execute(
        select(Meeting).where(Meeting.id == meeting_id, Meeting.user_id == user_id)
    )
    if not meeting_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Meeting not found")

    transcript_result = await db.execute(
        select(Transcript).where(Transcript.meeting_id == meeting_id)
    )
    transcript = transcript_result.scalar_one_or_none()
    if not transcript:
        return ApiResponse(data={"matches": [], "total": 0})

    segments_result = await db.execute(
        select(TranscriptSegment)
        .where(
            TranscriptSegment.transcript_id == transcript.id,
            TranscriptSegment.text.ilike(f"%{q}%")
        )
        .order_by(TranscriptSegment.segment_index)
    )
    matching = segments_result.scalars().all()

    matches = []
    for seg in matching:
        # Find positions of the query within the text
        text_lower = seg.text.lower()
        query_lower = q.lower()
        positions = []
        start = 0
        while True:
            pos = text_lower.find(query_lower, start)
            if pos == -1:
                break
            positions.append(pos)
            start = pos + 1

        matches.append({
            "segment_id": seg.id,
            "segment_index": seg.segment_index,
            "start_time": seg.start_time,
            "speaker_name": seg.speaker_name,
            "text": seg.text,
            "positions": positions,
        })

    return ApiResponse(data={"matches": matches, "total": len(matches)})
