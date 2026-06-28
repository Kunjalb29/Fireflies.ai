"use client";
/**
 * TranscriptSegment Component
 * Individual transcript segment with speaker info, timestamp, highlight, and search highlighting.
 */
import { useRef, useEffect, memo } from "react";
import { Highlighter, Copy, Clock } from "lucide-react";
import { cn, getInitials, getSpeakerColor, formatSeconds, highlightText } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import type { TranscriptSegment as TranscriptSegmentType, HighlightColor } from "@/types";
import toast from "react-hot-toast";

interface TranscriptSegmentProps {
  segment: TranscriptSegmentType;
  isActive: boolean;
  onHighlight: (segmentId: string, color: HighlightColor) => void;
  searchQuery: string;
  isCurrentMatch?: boolean;
}

const HIGHLIGHT_COLORS: { color: HighlightColor; bg: string; label: string }[] = [
  { color: "yellow", bg: "bg-yellow-400", label: "Yellow" },
  { color: "green", bg: "bg-green-400", label: "Green" },
  { color: "pink", bg: "bg-pink-400", label: "Pink" },
  { color: "blue", bg: "bg-blue-400", label: "Blue" },
];

function getHighlightClass(color: HighlightColor): string {
  switch (color) {
    case "yellow": return "highlighted-yellow";
    case "green": return "highlighted-green";
    case "pink": return "highlighted-pink";
    case "blue": return "highlighted-blue";
  }
}

export const TranscriptSegmentView = memo(function TranscriptSegmentView({
  segment, isActive, onHighlight, searchQuery, isCurrentMatch
}: TranscriptSegmentProps) {
  const segRef = useRef<HTMLDivElement>(null);
  const { seekTo } = usePlayerStore();

  const existingHighlight = segment.highlights[0];
  const highlightClass = existingHighlight ? getHighlightClass(existingHighlight.color as HighlightColor) : "";

  // Auto-scroll active segment into view
  useEffect(() => {
    if (isActive && segRef.current) {
      segRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isActive]);

  // Auto-scroll current search match
  useEffect(() => {
    if (isCurrentMatch && segRef.current) {
      segRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isCurrentMatch]);

  const handleCopy = () => {
    navigator.clipboard.writeText(segment.text);
    toast.success("Copied to clipboard");
  };

  const displayText = searchQuery
    ? highlightText(segment.text, searchQuery)
    : segment.text;

  return (
    <div
      ref={segRef}
      id={`segment-${segment.id}`}
      className={cn(
        "segment group",
        isActive && "active",
        highlightClass,
        isCurrentMatch && "ring-1 ring-primary/50"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Speaker Avatar */}
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0",
          getSpeakerColor(segment.speaker_name)
        )}>
          {getInitials(segment.speaker_name)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white">{segment.speaker_name}</span>
            {segment.start_time !== null && (
              <button
                onClick={() => seekTo(segment.start_time!)}
                className="flex items-center gap-0.5 text-xs font-mono text-text-muted-dark hover:text-accent transition-colors"
                aria-label={`Seek to ${formatSeconds(segment.start_time)}`}
              >
                <Clock className="w-3 h-3" />
                {formatSeconds(segment.start_time)}
              </button>
            )}
          </div>

          <p
            className="text-sm text-text-muted-dark leading-relaxed"
            dangerouslySetInnerHTML={{ __html: displayText }}
          />
        </div>

        {/* Actions (on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {/* Highlight color picker */}
          <div className="relative group/highlight">
            <button
              className="btn-ghost btn-icon"
              aria-label="Highlight segment"
            >
              <Highlighter className="w-3.5 h-3.5 text-text-muted-dark" />
            </button>
            {/* Color picker popover */}
            <div className="absolute right-0 top-full mt-1 p-2 card flex gap-1.5 opacity-0 group-hover/highlight:opacity-100 pointer-events-none group-hover/highlight:pointer-events-auto transition-opacity z-20">
              {HIGHLIGHT_COLORS.map(({ color, bg, label }) => (
                <button
                  key={color}
                  onClick={() => onHighlight(segment.id, color)}
                  className={cn("w-5 h-5 rounded-full border-2 border-white/20 hover:border-white/60 transition-colors", bg)}
                  aria-label={`Highlight ${label}`}
                  title={label}
                />
              ))}
            </div>
          </div>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="btn-ghost btn-icon"
            aria-label="Copy segment text"
          >
            <Copy className="w-3.5 h-3.5 text-text-muted-dark" />
          </button>
        </div>
      </div>
    </div>
  );
});
