"use client";
/**
 * TagChip Component — colored tag chip with optional remove button.
 */
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types";

const TAG_STYLE_MAP: Record<string, { bg: string; text: string; border: string }> = {
  "#6C47FF": { bg: "bg-purple-500/15", text: "text-purple-300", border: "border-purple-500/20" },
  "#00C2FF": { bg: "bg-cyan-500/15", text: "text-cyan-300", border: "border-cyan-500/20" },
  "#22C55E": { bg: "bg-green-500/15", text: "text-green-300", border: "border-green-500/20" },
  "#F59E0B": { bg: "bg-amber-500/15", text: "text-amber-300", border: "border-amber-500/20" },
};

function getTagStyles(color: string | null) {
  if (!color) return { bg: "bg-white/5", text: "text-text-muted-dark", border: "border-white/10" };
  return TAG_STYLE_MAP[color] || { bg: "bg-white/5", text: "text-text-muted-dark", border: "border-white/10" };
}

interface TagChipProps {
  tag: Tag;
  onRemove?: () => void;
  size?: "sm" | "default";
}

export function TagChip({ tag, onRemove, size = "default" }: TagChipProps) {
  const styles = getTagStyles(tag.color);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        styles.bg, styles.text, styles.border,
        size === "sm" ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-xs"
      )}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="hover:opacity-70 transition-opacity"
          aria-label={`Remove ${tag.name} tag`}
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}
