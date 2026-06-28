"use client";
/**
 * Meetings Library Page — Main app view showing all meetings.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, BarChart2, Clock, CheckSquare, Calendar, SlidersHorizontal } from "lucide-react";
import { getMeetings, deleteMeeting, getStats } from "@/lib/services";
import { MeetingCard } from "@/components/MeetingCard";
import { StatsCard } from "@/components/StatsCard";
import { SkeletonCard, SkeletonStatsCard } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmModal } from "@/components/ConfirmModal";
import { NewMeetingDrawer } from "@/components/NewMeetingDrawer";
import { useUIStore } from "@/store";
import { cn } from "@/lib/utils";
import type { MeetingListItem } from "@/types";
import toast from "react-hot-toast";

const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "oldest", label: "Oldest First" },
  { value: "longest", label: "Longest" },
];

export default function MeetingsPage() {
  const queryClient = useQueryClient();
  const { setNewMeetingDrawerOpen, newMeetingDrawerOpen, setSearchModalOpen } = useUIStore();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "oldest" | "longest">("recent");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<"all" | "week" | "month">("all");

  const getDateRange = () => {
    const now = new Date();
    if (dateFilter === "week") {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return { date_from: from.toISOString(), date_to: undefined };
    }
    if (dateFilter === "month") {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return { date_from: from.toISOString(), date_to: undefined };
    }
    return { date_from: undefined, date_to: undefined };
  };

  const { data: meetingsData, isLoading: meetingsLoading } = useQuery({
    queryKey: ["meetings", { search, sort, dateFilter }],
    queryFn: () => getMeetings({ search: search || undefined, sort, limit: 50, ...getDateRange() }),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Meeting deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete meeting"),
  });

  const meetings: MeetingListItem[] = meetingsData?.data || [];

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Meetings</h1>
          <p className="text-sm text-text-muted-dark mt-0.5">
            {meetingsData?.meta?.total || 0} meetings recorded
          </p>
        </div>
        <button
          onClick={() => setNewMeetingDrawerOpen(true)}
          className="btn-primary"
          id="new-meeting-btn"
        >
          <Plus className="w-4 h-4" />
          New Meeting
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatsCard key={i} />)
        ) : statsData ? (
          <>
            <StatsCard
              label="Total Meetings"
              value={statsData.total_meetings}
              icon={BarChart2}
              iconColor="text-primary"
              trend={{ value: 12, label: "this month" }}
            />
            <StatsCard
              label="Hours Recorded"
              value={`${Math.round(statsData.total_duration_mins / 60 * 10) / 10}h`}
              icon={Clock}
              iconColor="text-accent"
            />
            <StatsCard
              label="Action Items"
              value={statsData.total_action_items}
              icon={CheckSquare}
              iconColor="text-success"
            />
            <StatsCard
              label="This Week"
              value={statsData.this_week_count}
              icon={Calendar}
              iconColor="text-warning"
            />
          </>
        ) : null}
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-dark" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings, transcripts, participants…"
            className="input input-lg pl-10 w-full"
            id="meetings-search"
          />
          <button
            onClick={() => setSearchModalOpen(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted-dark bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono hidden md:block hover:bg-white/10 transition-colors cursor-pointer"
            title="Open global search (⌘K)"
          >
            ⌘K
          </button>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-button p-0.5">
            {(["All", "This Week", "This Month"] as const).map((label, i) => {
              const value = ["all", "week", "month"][i] as "all" | "week" | "month";
              const isActive = dateFilter === value;
              return (
                <button
                  key={label}
                  onClick={() => setDateFilter(value)}
                  className={cn(
                    "px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all duration-150",
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-text-muted-dark hover:text-white"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <SlidersHorizontal className="w-4 h-4 text-text-muted-dark" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="input py-1.5 text-xs w-36"
              id="sort-select"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Meetings list */}
      {meetingsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : meetings.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title={search ? "No meetings found" : "No meetings yet"}
          description={
            search
              ? `No meetings match "${search}". Try a different search term.`
              : "Upload your first transcript to get started with AI-powered meeting intelligence."
          }
          action={search ? undefined : {
            label: "Create your first meeting",
            onClick: () => setNewMeetingDrawerOpen(true),
          }}
        />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {meetings.map((meeting, i) => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
              >
                <MeetingCard
                  meeting={meeting}
                  onDelete={(id) => setDeleteId(id)}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete meeting?"
        description="This will permanently delete the meeting, its transcript, summary, and all action items. This action cannot be undone."
        confirmLabel="Delete meeting"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteMutation.isPending}
      />

      {/* New Meeting Drawer */}
      <NewMeetingDrawer
        isOpen={newMeetingDrawerOpen}
        onClose={() => setNewMeetingDrawerOpen(false)}
      />
    </div>
  );
}
