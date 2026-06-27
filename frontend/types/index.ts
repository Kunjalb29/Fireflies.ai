// MeetMind TypeScript Type Definitions

export type Plan = "free" | "pro" | "business";
export type MeetingStatus = "processing" | "processed" | "failed";
export type Priority = "low" | "medium" | "high";
export type ActionItemStatus = "pending" | "in_progress" | "done";
export type Sentiment = "positive" | "neutral" | "mixed" | "negative";
export type HighlightColor = "yellow" | "green" | "pink" | "blue";

// ── User ──────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  plan: Plan;
  created_at: string;
}

// ── Tag ───────────────────────────────────────────────────────────────────
export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

// ── Transcript Segment ────────────────────────────────────────────────────
export interface Highlight {
  id: string;
  segment_id: string;
  meeting_id: string;
  note: string | null;
  color: HighlightColor;
  created_at: string;
}

export interface TranscriptSegment {
  id: string;
  transcript_id: string;
  speaker_name: string;
  speaker_email: string | null;
  start_time: number | null;
  end_time: number | null;
  text: string;
  segment_index: number | null;
  highlights: Highlight[];
}

// ── Transcript ────────────────────────────────────────────────────────────
export interface Transcript {
  id: string;
  meeting_id: string;
  raw_text: string | null;
  word_count: number | null;
  segments: TranscriptSegment[];
}

// ── Chapter ───────────────────────────────────────────────────────────────
export interface Chapter {
  title: string;
  start_seconds: number;
  summary: string;
}

// ── Summary ───────────────────────────────────────────────────────────────
export interface Summary {
  id: string;
  meeting_id: string;
  overview: string | null;
  key_points: string[] | null;
  chapters: Chapter[] | null;
  sentiment: Sentiment | null;
  generated_at: string;
}

// ── Action Item ───────────────────────────────────────────────────────────
export interface ActionItem {
  id: string;
  meeting_id: string;
  meeting_title?: string;
  text: string;
  assignee: string | null;
  due_date: string | null;
  priority: Priority;
  status: ActionItemStatus;
  created_at: string;
  updated_at: string;
}

// ── Meeting List Item (partial) ───────────────────────────────────────────
export interface MeetingListItem {
  id: string;
  title: string;
  date: string;
  duration_secs: number;
  status: MeetingStatus;
  participants: string[] | null;
  audio_url: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
  summary_overview: string | null;
  action_items_count: number;
}

// ── Meeting Detail (full) ─────────────────────────────────────────────────
export interface MeetingDetail {
  id: string;
  title: string;
  date: string;
  duration_secs: number;
  status: MeetingStatus;
  participants: string[] | null;
  audio_url: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
  transcript: Transcript | null;
  summary: Summary | null;
  action_items: ActionItem[];
}

// ── Stats ─────────────────────────────────────────────────────────────────
export interface Stats {
  total_meetings: number;
  total_duration_mins: number;
  total_action_items: number;
  this_week_count: number;
}

// ── Search ────────────────────────────────────────────────────────────────
export interface SearchResultItem {
  type: "meeting" | "transcript" | "action_item";
  id: string;
  meeting_id: string;
  title: string;
  snippet: string | null;
  date: string | null;
  speaker_name?: string;
  start_time?: number;
  status?: string;
  priority?: string;
}

export interface SearchResults {
  meetings: SearchResultItem[];
  transcripts: SearchResultItem[];
  action_items: SearchResultItem[];
}

// ── API Response ──────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  error?: string;
}

// ── Form Types ────────────────────────────────────────────────────────────
export interface NewMeetingForm {
  title: string;
  date: string;
  duration_secs: number;
  participants: string[];
  transcript_text: string;
}

export interface ActionItemCreateForm {
  text: string;
  assignee: string;
  due_date: string;
  priority: Priority;
}

// ── Player State ──────────────────────────────────────────────────────────
export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}
