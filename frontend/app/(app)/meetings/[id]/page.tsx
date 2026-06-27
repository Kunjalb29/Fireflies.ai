"use client";
/**
 * Meeting Detail Page — Full two-column view with transcript, summary, and media player.
 * Route: /meetings/[id]
 */
import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Share2, Download, Trash2, Edit, Plus, Search,
  ChevronLeft, ChevronRight, X, Tag
} from "lucide-react";
import {
  getMeeting, generateSummary, updateActionItem, createActionItem,
  deleteActionItem, createHighlight, updateMeeting, deleteMeeting
} from "@/lib/services";
import { MediaPlayer } from "@/components/MediaPlayer";
import { TranscriptSegmentView } from "@/components/TranscriptSegment";
import { SummaryPanel } from "@/components/SummaryPanel";
import { TagChip } from "@/components/TagChip";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ExportModal } from "@/components/ExportModal";
import { usePlayerStore, useTranscriptSearchStore } from "@/store";
import { cn, getInitials, getSpeakerColor, formatDuration, formatAbsoluteDate } from "@/lib/utils";
import type { ActionItem, HighlightColor, MeetingDetail } from "@/types";
import toast from "react-hot-toast";

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { activeSegmentId } = usePlayerStore();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [transcriptQuery, setTranscriptQuery] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);

  const {
    query: searchQuery, matchingIds, currentMatchIndex,
    setQuery, setMatches, nextMatch, prevMatch, clearSearch
  } = useTranscriptSearchStore();

  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ["meeting", params.id],
    queryFn: () => getMeeting(params.id),
  });

  // Scroll to highlighted segment from search params
  useEffect(() => {
    const segId = searchParams.get("highlight");
    if (segId) {
      setTimeout(() => {
        document.getElementById(`segment-${segId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    }
  }, [searchParams, meeting]);

  // Update matching segments on search
  useEffect(() => {
    const segments = meeting?.transcript?.segments || [];
    if (!transcriptQuery.trim()) {
      setMatches([]);
      return;
    }
    const matched = segments
      .filter((s) => s.text.toLowerCase().includes(transcriptQuery.toLowerCase()))
      .map((s) => s.id);
    setMatches(matched);
  }, [transcriptQuery, meeting, setMatches]);

  const deleteMutation = useMutation({
    mutationFn: () => deleteMeeting(params.id),
    onSuccess: () => {
      toast.success("Meeting deleted");
      router.push("/meetings");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const updateTitleMutation = useMutation({
    mutationFn: (title: string) => updateMeeting(params.id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", params.id] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Title updated");
      setIsEditingTitle(false);
    },
    onError: () => toast.error("Failed to update title"),
  });

  const toggleActionItem = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateActionItem(id, { status: status === "done" ? "pending" : "done" }),
    onMutate: async ({ id, status }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["meeting", params.id] });
      const prev = queryClient.getQueryData<MeetingDetail>(["meeting", params.id]);
      if (prev) {
        queryClient.setQueryData<MeetingDetail>(["meeting", params.id], {
          ...prev,
          action_items: prev.action_items.map((a) =>
            a.id === id ? { ...a, status: status === "done" ? "pending" : "done" } : a
          ),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["meeting", params.id], ctx.prev);
      toast.error("Failed to update");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meeting", params.id] }),
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ActionItem> }) =>
      updateActionItem(id, data as Parameters<typeof updateActionItem>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", params.id] });
      toast.success("Updated");
    },
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => deleteActionItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", params.id] });
      toast.success("Deleted");
    },
  });

  const addItem = useMutation({
    mutationFn: (data: { text: string; assignee: string; due_date: string; priority: string }) =>
      createActionItem(params.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", params.id] });
      toast.success("Action item added");
    },
  });

  const handleHighlight = useCallback(async (segmentId: string, color: HighlightColor) => {
    try {
      await createHighlight({ segment_id: segmentId, meeting_id: params.id, color });
      queryClient.invalidateQueries({ queryKey: ["meeting", params.id] });
      toast.success("Highlight added");
    } catch {
      toast.error("Failed to add highlight");
    }
  }, [params.id, queryClient]);

  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true);
    toast("Generating AI summary…", { icon: "✨", duration: 3000 });
    try {
      await generateSummary(params.id);
      queryClient.invalidateQueries({ queryKey: ["meeting", params.id] });
      toast.success("Summary generated!");
    } catch {
      toast.error("Failed to generate summary");
    } finally {
      setIsRegenerating(false);
    }
  }, [params.id, queryClient]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-muted-dark">Loading meeting…</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-white mb-2">Meeting not found</p>
          <button onClick={() => router.push("/meetings")} className="btn-primary">
            Back to meetings
          </button>
        </div>
      </div>
    );
  }

  const segments = meeting.transcript?.segments || [];
  const highlightFromParam = searchParams.get("highlight");

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-white/[0.06] bg-surface-dark px-6 py-4">
        {/* Back + actions row */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => router.push("/meetings")}
            className="flex items-center gap-2 text-sm text-text-muted-dark hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All meetings
          </button>

          <div className="flex items-center gap-2">
            <button className="btn-secondary btn-sm" title="Share (coming soon)">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
            <button
              className="btn-secondary btn-sm"
              onClick={() => setShowExportModal(true)}
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn-danger btn-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>

        {/* Title row */}
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => { if (editTitle.trim()) updateTitleMutation.mutate(editTitle); else setIsEditingTitle(false); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { if (editTitle.trim()) updateTitleMutation.mutate(editTitle); }
                  if (e.key === "Escape") setIsEditingTitle(false);
                }}
                className="input text-xl font-bold w-full"
                autoFocus
              />
            ) : (
              <h1
                className="text-xl font-bold text-white cursor-pointer hover:text-primary/90 transition-colors group flex items-center gap-2"
                onClick={() => { setEditTitle(meeting.title); setIsEditingTitle(true); }}
              >
                {meeting.title}
                <Edit className="w-4 h-4 text-text-muted-dark opacity-0 group-hover:opacity-100 transition-opacity" />
              </h1>
            )}

            {/* Meta */}
            <div className="flex items-center flex-wrap gap-3 mt-1.5 text-sm text-text-muted-dark">
              <span>{formatAbsoluteDate(meeting.date)}</span>
              <span>·</span>
              <span>{formatDuration(meeting.duration_secs)}</span>
              <span>·</span>
              <div className="flex -space-x-1">
                {(meeting.participants || []).slice(0, 5).map((name, i) => (
                  <div
                    key={i}
                    className={cn("w-5 h-5 rounded-full border border-surface-dark text-[9px] font-bold text-white flex items-center justify-center", getSpeakerColor(name))}
                    title={name}
                  >
                    {getInitials(name)}
                  </div>
                ))}
                <span className="ml-2 text-xs">{meeting.participants?.length || 0} people</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-1.5 mt-2">
              {meeting.tags.map((tag) => (
                <TagChip key={tag.id} tag={tag} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Media Player ────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-white/[0.06]">
        <MediaPlayer
          audioUrl={meeting.audio_url}
          segments={segments}
        />
      </div>

      {/* ── Two-column content ───────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Transcript Panel */}
        <div className="w-[55%] flex flex-col border-r border-white/[0.06] overflow-hidden">
          {/* Transcript header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] shrink-0">
            <h2 className="text-sm font-semibold text-white">Transcript</h2>
            <span className="badge-neutral text-[10px]">{segments.length} segments</span>
            {meeting.transcript?.word_count && (
              <span className="text-[11px] text-text-muted-dark">{meeting.transcript.word_count.toLocaleString()} words</span>
            )}

            {/* Search */}
            <div className="flex items-center gap-1.5 ml-auto">
              {searchQuery && (
                <>
                  <span className="text-[11px] text-text-muted-dark">
                    {currentMatchIndex + 1} / {matchingIds.length}
                  </span>
                  <button onClick={prevMatch} className="btn-ghost btn-icon p-1">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={nextMatch} className="btn-ghost btn-icon p-1">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted-dark" />
                <input
                  type="text"
                  value={transcriptQuery}
                  onChange={(e) => { setTranscriptQuery(e.target.value); setQuery(e.target.value); }}
                  placeholder="Search in transcript…"
                  className="input py-1.5 pl-7 pr-6 text-xs w-44"
                />
                {transcriptQuery && (
                  <button
                    onClick={() => { setTranscriptQuery(""); clearSearch(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-3 h-3 text-text-muted-dark" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Segments */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {segments.length === 0 ? (
              <div className="text-center py-16 text-text-muted-dark text-sm">
                No transcript available for this meeting.
              </div>
            ) : (
              segments.map((seg, i) => (
                <TranscriptSegmentView
                  key={seg.id}
                  segment={seg}
                  isActive={activeSegmentId === seg.id}
                  onHighlight={handleHighlight}
                  searchQuery={transcriptQuery}
                  isSearchMatch={matchingIds.includes(seg.id)}
                  isCurrentMatch={matchingIds[currentMatchIndex] === seg.id || seg.id === highlightFromParam}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Summary Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <SummaryPanel
            summary={meeting.summary}
            actionItems={meeting.action_items}
            onRegenerateSummary={handleRegenerate}
            onToggleActionItem={(id, status) => toggleActionItem.mutate({ id, status })}
            onUpdateActionItem={(id, data) => updateItem.mutate({ id, data })}
            onDeleteActionItem={(id) => deleteItem.mutate(id)}
            onAddActionItem={(data) => addItem.mutate(data)}
            isRegenerating={isRegenerating}
            meetingId={params.id}
          />
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete this meeting?"
        description="This action permanently deletes the meeting, transcript, summary, and all action items. It cannot be undone."
        confirmLabel="Delete meeting"
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={deleteMutation.isPending}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        meeting={meeting}
      />
    </div>
  );
}
