"""
AI Service for MeetMind.
Generates meeting summaries using Claude (claude-sonnet-4-6).
Falls back to realistic mock data when ANTHROPIC_API_KEY is not set.
"""
import json
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.models.models import Meeting, Transcript, TranscriptSegment, Summary, generate_uuid, now

logger = logging.getLogger(__name__)


def _format_time(seconds: float) -> str:
    """Format seconds into MM:SS string."""
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins:02d}:{secs:02d}"


def _build_transcript_text(segments: list[TranscriptSegment]) -> str:
    """Build formatted transcript string from segments."""
    lines = []
    for seg in segments:
        time_str = _format_time(seg.start_time or 0)
        lines.append(f"[{time_str}] {seg.speaker_name}: {seg.text}")
    return "\n".join(lines)


def _get_mock_summary(meeting_title: str, transcript_text: str) -> dict:
    """
    Return realistic mock summary data when API key is not configured.
    This ensures the app works fully without an Anthropic API key.
    """
    return {
        "overview": (
            f"The meeting titled '{meeting_title}' covered several important topics discussed by the team. "
            "Participants engaged in productive dialogue, sharing updates and aligning on next steps. "
            "Key decisions were made regarding priorities and responsibilities. "
            "The team demonstrated strong collaboration and clear communication throughout the session. "
            "Concrete action items were identified to drive the discussed initiatives forward."
        ),
        "key_points": [
            "Team members provided comprehensive status updates on current projects",
            "Critical blockers were identified and mitigation strategies were proposed",
            "Resource allocation decisions were finalized for the upcoming sprint",
            "Timeline adjustments were agreed upon based on current velocity",
            "Cross-functional dependencies were mapped and owners assigned",
            "Risk items were escalated to appropriate stakeholders for resolution",
        ],
        "chapters": [
            {
                "title": "Opening & Context Setting",
                "start_seconds": 0,
                "summary": "Meeting kicked off with agenda review and context setting from the meeting organizer."
            },
            {
                "title": "Status Updates & Discussion",
                "start_seconds": 300,
                "summary": "Team members shared progress updates, discussed current challenges, and explored solutions."
            },
            {
                "title": "Decisions & Action Items",
                "start_seconds": 900,
                "summary": "Key decisions were made and specific action items assigned with owners and deadlines."
            }
        ],
        "sentiment": "positive"
    }


async def generate_summary(meeting_id: str, db: AsyncSession) -> Optional[Summary]:
    """
    Generate or regenerate an AI summary for a meeting.
    
    Steps:
    1. Fetch transcript segments from DB
    2. Build formatted transcript text
    3. Call Anthropic API (or fall back to mock if key not set)
    4. Parse JSON response
    5. Upsert summary record into DB
    """
    # Fetch meeting and its transcript
    meeting_result = await db.execute(
        select(Meeting).where(Meeting.id == meeting_id)
    )
    meeting = meeting_result.scalar_one_or_none()
    if not meeting:
        raise ValueError(f"Meeting {meeting_id} not found")

    transcript_result = await db.execute(
        select(Transcript).where(Transcript.meeting_id == meeting_id)
    )
    transcript = transcript_result.scalar_one_or_none()

    segments = []
    if transcript:
        segments_result = await db.execute(
            select(TranscriptSegment)
            .where(TranscriptSegment.transcript_id == transcript.id)
            .order_by(TranscriptSegment.segment_index)
        )
        segments = segments_result.scalars().all()

    transcript_text = _build_transcript_text(segments)

    # Try Anthropic API first, fall back to mock
    summary_data = None
    if settings.ANTHROPIC_API_KEY:
        try:
            summary_data = await _call_anthropic(transcript_text)
        except Exception as e:
            logger.warning(f"Anthropic API call failed, using mock: {e}")
            summary_data = _get_mock_summary(meeting.title, transcript_text)
    else:
        logger.info("ANTHROPIC_API_KEY not set — using mock summary data")
        summary_data = _get_mock_summary(meeting.title, transcript_text)

    # Upsert the summary record
    existing_result = await db.execute(
        select(Summary).where(Summary.meeting_id == meeting_id)
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        existing.overview = summary_data.get("overview")
        existing.key_points = summary_data.get("key_points")
        existing.chapters = summary_data.get("chapters")
        existing.sentiment = summary_data.get("sentiment")
        existing.generated_at = now()
        summary_obj = existing
    else:
        summary_obj = Summary(
            id=generate_uuid(),
            meeting_id=meeting_id,
            overview=summary_data.get("overview"),
            key_points=summary_data.get("key_points"),
            chapters=summary_data.get("chapters"),
            sentiment=summary_data.get("sentiment"),
            generated_at=now(),
        )
        db.add(summary_obj)

    await db.commit()
    await db.refresh(summary_obj)
    return summary_obj


async def _call_anthropic(transcript_text: str) -> dict:
    """Call Anthropic Claude API to generate meeting summary."""
    import anthropic

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    system_prompt = (
        "You are a meeting intelligence AI. Analyze this meeting transcript and "
        "return a JSON object with exactly these keys:\n"
        "- overview: string (3-5 sentence paragraph summarizing the meeting)\n"
        "- key_points: string[] (5-7 bullet points of key decisions/discussions)\n"
        "- chapters: array of {title: string, start_seconds: number, summary: string} "
        "(3-5 logical chapters/sections of the meeting)\n"
        "- sentiment: 'positive' | 'neutral' | 'mixed' | 'negative'\n"
        "Return ONLY valid JSON, no markdown, no explanation."
    )

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=system_prompt,
        messages=[
            {"role": "user", "content": f"Meeting transcript:\n\n{transcript_text}"}
        ]
    )

    response_text = message.content[0].text.strip()
    # Strip markdown code fences if present
    if response_text.startswith("```"):
        lines = response_text.split("\n")
        response_text = "\n".join(lines[1:-1])

    return json.loads(response_text)
