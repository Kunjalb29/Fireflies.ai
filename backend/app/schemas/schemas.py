"""
Pydantic v2 schemas for MeetMind API.
All request/response validation and serialization happens here.
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime, date
from enum import Enum


# ── Enums ──────────────────────────────────────────────────────────────────

class PlanEnum(str, Enum):
    free = "free"
    pro = "pro"
    business = "business"


class MeetingStatusEnum(str, Enum):
    processing = "processing"
    processed = "processed"
    failed = "failed"


class PriorityEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class ActionItemStatusEnum(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    done = "done"


class SentimentEnum(str, Enum):
    positive = "positive"
    neutral = "neutral"
    mixed = "mixed"
    negative = "negative"


class HighlightColorEnum(str, Enum):
    yellow = "yellow"
    green = "green"
    pink = "pink"
    blue = "blue"


# ── User Schemas ───────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email: str
    name: str
    avatar_url: Optional[str] = None
    plan: PlanEnum = PlanEnum.free


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None


class UserOut(UserBase):
    id: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Tag Schemas ────────────────────────────────────────────────────────────

class TagBase(BaseModel):
    name: str
    color: Optional[str] = None


class TagCreate(TagBase):
    pass


class TagOut(TagBase):
    id: str

    model_config = {"from_attributes": True}


# ── TranscriptSegment Schemas ──────────────────────────────────────────────

class TranscriptSegmentBase(BaseModel):
    speaker_name: str
    speaker_email: Optional[str] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    text: str
    segment_index: Optional[int] = None


class TranscriptSegmentCreate(TranscriptSegmentBase):
    pass


class HighlightOut(BaseModel):
    id: str
    segment_id: str
    meeting_id: str
    note: Optional[str] = None
    color: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TranscriptSegmentOut(TranscriptSegmentBase):
    id: str
    transcript_id: str
    highlights: List[HighlightOut] = []

    model_config = {"from_attributes": True}


# ── Transcript Schemas ─────────────────────────────────────────────────────

class TranscriptOut(BaseModel):
    id: str
    meeting_id: str
    raw_text: Optional[str] = None
    word_count: Optional[int] = None
    segments: List[TranscriptSegmentOut] = []

    model_config = {"from_attributes": True}


# ── Summary Schemas ────────────────────────────────────────────────────────

class ChapterSchema(BaseModel):
    title: str
    start_seconds: float
    summary: str


class SummaryBase(BaseModel):
    overview: Optional[str] = None
    key_points: Optional[List[str]] = None
    chapters: Optional[List[Any]] = None
    sentiment: Optional[SentimentEnum] = None


class SummaryOut(SummaryBase):
    id: str
    meeting_id: str
    generated_at: datetime

    model_config = {"from_attributes": True}


# ── ActionItem Schemas ─────────────────────────────────────────────────────

class ActionItemBase(BaseModel):
    text: str
    assignee: Optional[str] = None
    due_date: Optional[date] = None
    priority: PriorityEnum = PriorityEnum.medium
    status: ActionItemStatusEnum = ActionItemStatusEnum.pending


class ActionItemCreate(ActionItemBase):
    pass


class ActionItemUpdate(BaseModel):
    text: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[date] = None
    priority: Optional[PriorityEnum] = None
    status: Optional[ActionItemStatusEnum] = None


class ActionItemOut(ActionItemBase):
    id: str
    meeting_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Highlight Schemas ──────────────────────────────────────────────────────

class HighlightCreate(BaseModel):
    segment_id: str
    meeting_id: str
    note: Optional[str] = None
    color: HighlightColorEnum = HighlightColorEnum.yellow


class HighlightUpdate(BaseModel):
    note: Optional[str] = None
    color: Optional[HighlightColorEnum] = None


# ── Meeting Schemas ────────────────────────────────────────────────────────

class MeetingBase(BaseModel):
    title: str
    date: datetime
    duration_secs: int
    participants: Optional[List[str]] = None


class MeetingCreate(BaseModel):
    title: str
    date: datetime
    duration_secs: Optional[int] = 0
    participants: Optional[List[str]] = None
    transcript_text: Optional[str] = None


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    participants: Optional[List[str]] = None
    status: Optional[MeetingStatusEnum] = None


class MeetingListOut(BaseModel):
    id: str
    title: str
    date: datetime
    duration_secs: int
    status: str
    participants: Optional[List[str]] = None
    audio_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    tags: List[TagOut] = []
    summary_overview: Optional[str] = None
    action_items_count: int = 0

    model_config = {"from_attributes": True}


class MeetingDetailOut(BaseModel):
    id: str
    title: str
    date: datetime
    duration_secs: int
    status: str
    participants: Optional[List[str]] = None
    audio_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    tags: List[TagOut] = []
    transcript: Optional[TranscriptOut] = None
    summary: Optional[SummaryOut] = None
    action_items: List[ActionItemOut] = []

    model_config = {"from_attributes": True}


# ── Stats Schema ───────────────────────────────────────────────────────────

class StatsOut(BaseModel):
    total_meetings: int
    total_duration_mins: float
    total_action_items: int
    this_week_count: int


# ── Search Schema ──────────────────────────────────────────────────────────

class SearchResultItem(BaseModel):
    type: str  # 'meeting' | 'transcript' | 'action_item'
    id: str
    meeting_id: str
    title: str
    snippet: Optional[str] = None
    date: Optional[datetime] = None


class SearchOut(BaseModel):
    meetings: List[SearchResultItem] = []
    transcripts: List[SearchResultItem] = []
    action_items: List[SearchResultItem] = []


# ── Generic Response ───────────────────────────────────────────────────────

class ApiResponse(BaseModel):
    data: Any
    meta: Optional[dict] = None
    error: Optional[str] = None


class PaginatedMeta(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
