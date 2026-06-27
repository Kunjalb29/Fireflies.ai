/**
 * Utility functions for MeetMind frontend.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, isToday, isTomorrow, isYesterday } from "date-fns";
import type { Priority, Sentiment } from "@/types";

// ── cn helper (Tailwind class merging) ───────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Duration formatting ──────────────────────────────────────────────────

export function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  if (hours === 0) return `${mins} min`;
  if (remainMins === 0) return `${hours}h`;
  return `${hours}h ${remainMins}m`;
}

export function formatSeconds(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Date formatting ──────────────────────────────────────────────────────

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  const distance = formatDistanceToNow(date, { addSuffix: true });
  return distance;
}

export function formatAbsoluteDate(dateStr: string): string {
  return format(new Date(dateStr), "MMM d, yyyy 'at' h:mm a");
}

export function formatShortDate(dateStr: string): string {
  return format(new Date(dateStr), "MMM d, yyyy");
}

export function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "No due date";
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return formatDistanceToNow(date, { addSuffix: true });
}

// ── Color helpers ─────────────────────────────────────────────────────────

export function getSpeakerColor(name: string): string {
  const colors = [
    "bg-purple-500", "bg-blue-500", "bg-teal-500", "bg-orange-500",
    "bg-pink-500", "bg-indigo-500", "bg-green-500", "bg-red-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getPriorityConfig(priority: Priority) {
  switch (priority) {
    case "high":
      return { label: "High", className: "badge-danger" };
    case "medium":
      return { label: "Medium", className: "badge-warning" };
    case "low":
      return { label: "Low", className: "badge-accent" };
  }
}

export function getSentimentConfig(sentiment: Sentiment | null) {
  switch (sentiment) {
    case "positive":
      return { label: "Positive", className: "badge-success", emoji: "😊" };
    case "negative":
      return { label: "Negative", className: "badge-danger", emoji: "😟" };
    case "mixed":
      return { label: "Mixed", className: "badge-warning", emoji: "😐" };
    case "neutral":
    default:
      return { label: "Neutral", className: "badge-neutral", emoji: "😶" };
  }
}

// ── Text helpers ──────────────────────────────────────────────────────────

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}

export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(
    new RegExp(`(${escaped})`, "gi"),
    "<mark>$1</mark>"
  );
}

// ── Local storage helpers ─────────────────────────────────────────────────

export function getStoredTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("meetmind-theme") as "dark" | "light") || "dark";
}

export function setStoredTheme(theme: "dark" | "light") {
  if (typeof window !== "undefined") {
    localStorage.setItem("meetmind-theme", theme);
  }
}

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("meetmind-searches") || "[]");
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string) {
  if (typeof window === "undefined") return;
  const searches = getRecentSearches();
  const updated = [query, ...searches.filter((s) => s !== query)].slice(0, 5);
  localStorage.setItem("meetmind-searches", JSON.stringify(updated));
}
