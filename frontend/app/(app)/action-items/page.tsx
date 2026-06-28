"use client";
/**
 * Action Items Page — /action-items
 * All action items across all meetings, grouped by meeting.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, ChevronDown, ChevronRight } from "lucide-react";
import { getAllActionItems, updateActionItem, deleteActionItem } from "@/lib/services";
import { ActionItemCard } from "@/components/ActionItemCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import type { ActionItem } from "@/types";
import toast from "react-hot-toast";
import Link from "next/link";

const FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Done", value: "done" },
  { label: "High Priority", value: "high" },
];

export default function ActionItemsPage() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("");
  const [collapsedMeetings, setCollapsedMeetings] = useState<Set<string>>(new Set());

  const isStatusFilter = ["pending", "done"].includes(activeFilter);
  const isPriorityFilter = activeFilter === "high";

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["all-action-items", activeFilter],
    queryFn: () => getAllActionItems({
      status: isStatusFilter ? activeFilter : undefined,
      priority: isPriorityFilter ? "high" : undefined,
    }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateActionItem(id, { status: status === "done" ? "pending" : "done" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["all-action-items"] }),
    onError: () => toast.error("Failed to update"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ActionItem> }) =>
      updateActionItem(id, data as Parameters<typeof updateActionItem>[1]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["all-action-items"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteActionItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-action-items"] });
      toast.success("Action item deleted");
    },
    onError: () => toast.error("Failed to delete action item"),
  });

  // Group by meeting
  const grouped = items.reduce<Record<string, { title: string; items: ActionItem[] }>>((acc, item) => {
    const key = item.meeting_id;
    if (!acc[key]) acc[key] = { title: item.meeting_title || "Meeting", items: [] };
    acc[key].items.push(item);
    return acc;
  }, {});

  const toggleCollapse = (meetingId: string) => {
    setCollapsedMeetings((prev) => {
      const next = new Set(prev);
      if (next.has(meetingId)) next.delete(meetingId);
      else next.add(meetingId);
      return next;
    });
  };

  const pendingCount = items.filter((i) => i.status !== "done").length;
  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Action Items</h1>
          <p className="text-sm text-text-muted-dark mt-0.5">
            {pendingCount} pending · {doneCount} completed
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-6 flex-wrap">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={cn(
              "px-3 py-1.5 rounded-button text-sm font-medium transition-all duration-150",
              activeFilter === value
                ? "bg-primary text-white"
                : "bg-white/5 text-text-muted-dark hover:text-white hover:bg-white/10"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No action items"
          description="Action items from your meetings will appear here. Create a meeting and generate a summary to get started."
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([meetingId, { title, items: meetingItems }]) => {
            const isCollapsed = collapsedMeetings.has(meetingId);
            return (
              <div key={meetingId} className="card overflow-hidden">
                {/* Meeting header */}
                <button
                  onClick={() => toggleCollapse(meetingId)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-text-muted-dark" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted-dark" />
                  )}
                  <Link
                    href={`/meetings/${meetingId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm font-semibold text-white hover:text-primary transition-colors"
                  >
                    {title}
                  </Link>
                  <span className="badge-neutral text-[10px] ml-auto">
                    {meetingItems.filter((i) => i.status !== "done").length} pending
                  </span>
                </button>

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden px-2 py-1"
                    >
                      {meetingItems.map((item) => (
                        <ActionItemCard
                          key={item.id}
                          item={item}
                          onToggle={(id, status) => toggleMutation.mutate({ id, status })}
                          onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                          onDelete={(id) => deleteMutation.mutate(id)}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
