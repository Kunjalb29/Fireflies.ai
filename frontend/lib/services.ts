/**
 * API service functions for all MeetMind entities.
 * All functions use React Query-friendly patterns (async, throw on error).
 */
import apiClient from "./api";
import type {
  MeetingListItem, MeetingDetail, Stats, SearchResults,
  ActionItem, Summary, Transcript, Tag, Highlight,
  ApiResponse,
} from "@/types";

// ── Meetings ───────────────────────────────────────────────────────────────

export interface MeetingsListParams {
  search?: string;
  tag?: string;
  date_from?: string;
  date_to?: string;
  sort?: "recent" | "oldest" | "longest";
  page?: number;
  limit?: number;
}

export async function getMeetings(params: MeetingsListParams = {}) {
  const res = await apiClient.get<ApiResponse<MeetingListItem[]>>("/meetings", { params });
  return res.data;
}

export async function getMeeting(id: string): Promise<MeetingDetail> {
  const res = await apiClient.get<ApiResponse<MeetingDetail>>(`/meetings/${id}`);
  return res.data.data;
}

export async function createMeeting(formData: FormData): Promise<{ id: string; status: string }> {
  const res = await apiClient.post<ApiResponse<{ id: string; status: string }>>(
    "/meetings",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.data;
}

export async function updateMeeting(
  id: string,
  data: { title?: string; participants?: string[] }
) {
  const res = await apiClient.patch<ApiResponse<{ id: string; title: string }>>(
    `/meetings/${id}`,
    data
  );
  return res.data.data;
}

export async function deleteMeeting(id: string): Promise<void> {
  await apiClient.delete(`/meetings/${id}`);
}

// ── Transcripts ────────────────────────────────────────────────────────────

export async function getTranscript(meetingId: string): Promise<Transcript> {
  const res = await apiClient.get<ApiResponse<Transcript>>(
    `/meetings/${meetingId}/transcript`
  );
  return res.data.data;
}

export async function searchTranscript(meetingId: string, q: string) {
  const res = await apiClient.get(`/meetings/${meetingId}/transcript/search`, {
    params: { q },
  });
  return res.data.data;
}

// ── Summaries ──────────────────────────────────────────────────────────────

export async function getSummary(meetingId: string): Promise<Summary> {
  const res = await apiClient.get<ApiResponse<Summary>>(
    `/meetings/${meetingId}/summary`
  );
  return res.data.data;
}

export async function generateSummary(meetingId: string): Promise<Summary> {
  const res = await apiClient.post<ApiResponse<Summary>>(
    `/meetings/${meetingId}/summary/generate`
  );
  return res.data.data;
}

// ── Action Items ───────────────────────────────────────────────────────────

export async function getActionItems(meetingId: string): Promise<ActionItem[]> {
  const res = await apiClient.get<ApiResponse<ActionItem[]>>(
    `/meetings/${meetingId}/action-items`
  );
  return res.data.data;
}

export async function getAllActionItems(params?: {
  status?: string;
  priority?: string;
}): Promise<ActionItem[]> {
  const res = await apiClient.get<ApiResponse<ActionItem[]>>("/action-items", {
    params,
  });
  return res.data.data;
}

export async function createActionItem(
  meetingId: string,
  data: {
    text: string;
    assignee?: string;
    due_date?: string;
    priority?: string;
    status?: string;
  }
): Promise<ActionItem> {
  const res = await apiClient.post<ApiResponse<ActionItem>>(
    `/meetings/${meetingId}/action-items`,
    data
  );
  return res.data.data;
}

export async function updateActionItem(
  id: string,
  data: Partial<{
    text: string;
    assignee: string;
    due_date: string;
    priority: string;
    status: string;
  }>
): Promise<ActionItem> {
  const res = await apiClient.patch<ApiResponse<ActionItem>>(
    `/action-items/${id}`,
    data
  );
  return res.data.data;
}

export async function deleteActionItem(id: string): Promise<void> {
  await apiClient.delete(`/action-items/${id}`);
}

// ── Highlights ─────────────────────────────────────────────────────────────

export async function createHighlight(data: {
  segment_id: string;
  meeting_id: string;
  note?: string;
  color?: string;
}): Promise<Highlight> {
  const res = await apiClient.post<ApiResponse<Highlight>>("/highlights", data);
  return res.data.data;
}

export async function deleteHighlight(id: string): Promise<void> {
  await apiClient.delete(`/highlights/${id}`);
}

// ── Tags ───────────────────────────────────────────────────────────────────

export async function getTags(): Promise<Tag[]> {
  const res = await apiClient.get<ApiResponse<Tag[]>>("/tags");
  return res.data.data;
}

export async function addTagToMeeting(
  meetingId: string,
  tagId: string
): Promise<void> {
  await apiClient.post(`/tags/meetings/${meetingId}/tags/${tagId}`);
}

export async function removeTagFromMeeting(
  meetingId: string,
  tagId: string
): Promise<void> {
  await apiClient.delete(`/tags/meetings/${meetingId}/tags/${tagId}`);
}

// ── Search ─────────────────────────────────────────────────────────────────

export async function globalSearch(q: string): Promise<SearchResults> {
  const res = await apiClient.get<ApiResponse<SearchResults>>("/search", {
    params: { q },
  });
  return res.data.data;
}

// ── Stats ──────────────────────────────────────────────────────────────────

export async function getStats(): Promise<Stats> {
  const res = await apiClient.get<ApiResponse<Stats>>("/stats");
  return res.data.data;
}
