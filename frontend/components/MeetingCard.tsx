"use client";
/**
 * MeetingCard Component
 * Displays a meeting in the list view with hover actions and all metadata.
 */
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, CheckSquare, Calendar, Edit, Trash2 } from "lucide-react";
import { cn, formatDuration, formatRelativeDate, formatAbsoluteDate, getInitials, getSpeakerColor, truncate } from "@/lib/utils";
import type { MeetingListItem } from "@/types";
import { useState } from "react";

interface MeetingCardProps {
  meeting: MeetingListItem;
  onDelete?: (id: string) => void;
  onEdit?: (meeting: MeetingListItem) => void;
}

const TAG_COLORS: Record<string, string> = {
  "#6C47FF": "bg-purple-500/15 text-purple-300 border-purple-500/20",
  "#00C2FF": "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
  "#22C55E": "bg-green-500/15 text-green-300 border-green-500/20",
  "#F59E0B": "bg-amber-500/15 text-amber-300 border-amber-500/20",
};

function getTagClass(color: string | null): string {
  if (!color) return "bg-white/5 text-text-muted-dark border-white/10";
  return TAG_COLORS[color] || "bg-white/5 text-text-muted-dark border-white/10";
}

const STATUS_CONFIG = {
  processed: { label: "Ready", className: "badge-success" },
  processing: { label: "Processing", className: "badge-warning" },
  failed: { label: "Failed", className: "badge-danger" },
};

export function MeetingCard({ meeting, onDelete, onEdit }: MeetingCardProps) {
  const [showAbsDate, setShowAbsDate] = useState(false);
  const statusCfg = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.processed;

  const displayedParticipants = (meeting.participants || []).slice(0, 4);
  const overflowCount = Math.max(0, (meeting.participants?.length || 0) - 4);

  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
    >
      <Link href={`/meetings/${meeting.id}`}>
        <div className="card-hover p-5 group relative">
          {/* Quick actions on hover */}
          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
            <button
              onClick={(e) => {
                e.preventDefault();
                onEdit?.(meeting);
              }}
              className="w-7 h-7 rounded-button bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Edit meeting"
            >
              <Edit className="w-3.5 h-3.5 text-text-muted-dark" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete?.(meeting.id);
              }}
              className="w-7 h-7 rounded-button bg-danger/10 hover:bg-danger/20 flex items-center justify-center transition-colors"
              aria-label="Delete meeting"
            >
              <Trash2 className="w-3.5 h-3.5 text-danger" />
            </button>
          </div>

          {/* Header row */}
          <div className="flex items-start gap-3 mb-3 pr-16">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[15px] text-white leading-snug mb-1 group-hover:text-primary transition-colors">
                {meeting.title}
              </h3>
              {/* Meta row */}
              <div className="flex items-center flex-wrap gap-3 text-xs text-text-muted-dark">
                {/* Date */}
                <span
                  className="flex items-center gap-1 cursor-default"
                  onMouseEnter={() => setShowAbsDate(true)}
                  onMouseLeave={() => setShowAbsDate(false)}
                >
                  <Calendar className="w-3 h-3" />
                  <span className="transition-all">
                    {showAbsDate ? formatAbsoluteDate(meeting.date) : formatRelativeDate(meeting.date)}
                  </span>
                </span>

                {/* Duration */}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(meeting.duration_secs)}
                </span>

                {/* Action items count */}
                {meeting.action_items_count > 0 && (
                  <span className="flex items-center gap-1">
                    <CheckSquare className="w-3 h-3 text-accent" />
                    <span className="text-accent">{meeting.action_items_count} tasks</span>
                  </span>
                )}

                {/* Status badge (only show non-processed) */}
                {meeting.status !== "processed" && (
                  <span className={cn("badge", statusCfg.className)}>
                    {statusCfg.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Summary snippet */}
          {meeting.summary_overview && (
            <p className="text-[13px] text-text-muted-dark mb-3 leading-relaxed">
              {truncate(meeting.summary_overview, 120)}
            </p>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between">
            {/* Participants */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {displayedParticipants.map((name, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-surface-dark",
                      getSpeakerColor(name)
                    )}
                    title={name}
                  >
                    {getInitials(name)}
                  </div>
                ))}
                {overflowCount > 0 && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-text-muted-dark bg-surface-card border border-surface-dark">
                    +{overflowCount}
                  </div>
                )}
              </div>
              <span className="text-[11px] text-text-muted-dark">
                {meeting.participants?.length || 0} participants
              </span>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {meeting.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className={cn("chip text-[11px]", getTagClass(tag.color))}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
