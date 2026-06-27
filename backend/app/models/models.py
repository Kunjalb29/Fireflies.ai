"""
SQLAlchemy ORM models for MeetMind.
All tables use UUID primary keys stored as TEXT (SQLite-compatible).
"""
import uuid
from datetime import datetime, date as date_type
from typing import Optional, List
from sqlalchemy import (
    String, Text, Integer, Float, DateTime, Date,
    ForeignKey, JSON, UniqueConstraint, Index,
    func, Boolean
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def now() -> datetime:
    return datetime.utcnow()


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    plan: Mapped[str] = mapped_column(String(50), default="free", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now, nullable=False)

    # Relationships
    meetings: Mapped[List["Meeting"]] = relationship("Meeting", back_populates="user", cascade="all, delete-orphan")


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    duration_secs: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="processed", nullable=False)
    participants: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    audio_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now, onupdate=now, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="meetings")
    transcript: Mapped[Optional["Transcript"]] = relationship("Transcript", back_populates="meeting", cascade="all, delete-orphan", uselist=False)
    summary: Mapped[Optional["Summary"]] = relationship("Summary", back_populates="meeting", cascade="all, delete-orphan", uselist=False)
    action_items: Mapped[List["ActionItem"]] = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan")
    highlights: Mapped[List["Highlight"]] = relationship("Highlight", back_populates="meeting", cascade="all, delete-orphan")
    meeting_tags: Mapped[List["MeetingTag"]] = relationship("MeetingTag", back_populates="meeting", cascade="all, delete-orphan")


class Transcript(Base):
    __tablename__ = "transcripts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    meeting_id: Mapped[str] = mapped_column(String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    word_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="transcript")
    segments: Mapped[List["TranscriptSegment"]] = relationship(
        "TranscriptSegment", back_populates="transcript",
        cascade="all, delete-orphan",
        order_by="TranscriptSegment.segment_index"
    )


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    transcript_id: Mapped[str] = mapped_column(String(36), ForeignKey("transcripts.id", ondelete="CASCADE"), nullable=False)
    speaker_name: Mapped[str] = mapped_column(String(255), nullable=False)
    speaker_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    start_time: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    end_time: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    segment_index: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    transcript: Mapped["Transcript"] = relationship("Transcript", back_populates="segments")
    highlights: Mapped[List["Highlight"]] = relationship("Highlight", back_populates="segment", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_transcript_segment", "transcript_id", "segment_index"),
    )


class Summary(Base):
    __tablename__ = "summaries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    meeting_id: Mapped[str] = mapped_column(String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    overview: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    key_points: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    chapters: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    sentiment: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=now, nullable=False)

    # Relationships
    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="summary")


class ActionItem(Base):
    __tablename__ = "action_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    meeting_id: Mapped[str] = mapped_column(String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    assignee: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    due_date: Mapped[Optional[date_type]] = mapped_column(Date, nullable=True)
    priority: Mapped[str] = mapped_column(String(50), default="medium", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now, onupdate=now, nullable=False)

    # Relationships
    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="action_items")


class Highlight(Base):
    __tablename__ = "highlights"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    segment_id: Mapped[str] = mapped_column(String(36), ForeignKey("transcript_segments.id", ondelete="CASCADE"), nullable=False)
    meeting_id: Mapped[str] = mapped_column(String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    color: Mapped[str] = mapped_column(String(50), default="yellow", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now, nullable=False)

    # Relationships
    segment: Mapped["TranscriptSegment"] = relationship("TranscriptSegment", back_populates="highlights")
    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="highlights")


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Relationships
    meeting_tags: Mapped[List["MeetingTag"]] = relationship("MeetingTag", back_populates="tag", cascade="all, delete-orphan")


class MeetingTag(Base):
    __tablename__ = "meeting_tags"

    meeting_id: Mapped[str] = mapped_column(String(36), ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True)
    tag_id: Mapped[str] = mapped_column(String(36), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

    # Relationships
    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="meeting_tags")
    tag: Mapped["Tag"] = relationship("Tag", back_populates="meeting_tags")
