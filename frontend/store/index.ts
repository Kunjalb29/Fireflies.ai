"use client";
/**
 * Zustand stores for MeetMind global state management.
 * Covers: player state, UI state, search, theme.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MeetingDetail, TranscriptSegment } from "@/types";

// ── Player Store ──────────────────────────────────────────────────────────
interface PlayerStore {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  activeSegmentId: string | null;
  setPlaying: (v: boolean) => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  setVolume: (v: number) => void;
  setPlaybackRate: (r: number) => void;
  setActiveSegment: (id: string | null) => void;
  seekTo: (time: number) => void; // triggers through ref
  seekTarget: number | null;
  clearSeekTarget: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  playbackRate: 1,
  activeSegmentId: null,
  seekTarget: null,
  setPlaying: (v) => set({ isPlaying: v }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setVolume: (v) => set({ volume: v }),
  setPlaybackRate: (r) => set({ playbackRate: r }),
  setActiveSegment: (id) => set({ activeSegmentId: id }),
  seekTo: (time) => set({ seekTarget: time }),
  clearSeekTarget: () => set({ seekTarget: null }),
}));

// ── UI Store ──────────────────────────────────────────────────────────────
interface UIStore {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  searchModalOpen: boolean;
  newMeetingDrawerOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleMobileSidebar: () => void;
  setSearchModalOpen: (v: boolean) => void;
  setNewMeetingDrawerOpen: (v: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      searchModalOpen: false,
      newMeetingDrawerOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleMobileSidebar: () => set((s) => ({ sidebarMobileOpen: !s.sidebarMobileOpen })),
      setSearchModalOpen: (v) => set({ searchModalOpen: v }),
      setNewMeetingDrawerOpen: (v) => set({ newMeetingDrawerOpen: v }),
    }),
    { name: "meetmind-ui", partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }) }
  )
);

// ── Theme Store ───────────────────────────────────────────────────────────
interface ThemeStore {
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
    }),
    { name: "meetmind-theme" }
  )
);

// ── Transcript Search Store ───────────────────────────────────────────────
interface TranscriptSearchStore {
  query: string;
  matchingIds: string[];
  currentMatchIndex: number;
  setQuery: (q: string) => void;
  setMatches: (ids: string[]) => void;
  nextMatch: () => void;
  prevMatch: () => void;
  clearSearch: () => void;
}

export const useTranscriptSearchStore = create<TranscriptSearchStore>((set, get) => ({
  query: "",
  matchingIds: [],
  currentMatchIndex: 0,
  setQuery: (q) => set({ query: q }),
  setMatches: (ids) => set({ matchingIds: ids, currentMatchIndex: 0 }),
  nextMatch: () =>
    set((s) => ({
      currentMatchIndex: (s.currentMatchIndex + 1) % Math.max(1, s.matchingIds.length),
    })),
  prevMatch: () =>
    set((s) => ({
      currentMatchIndex:
        (s.currentMatchIndex - 1 + s.matchingIds.length) % Math.max(1, s.matchingIds.length),
    })),
  clearSearch: () => set({ query: "", matchingIds: [], currentMatchIndex: 0 }),
}));

// ── Optimistic Action Items Store ─────────────────────────────────────────
interface OptimisticActionItem {
  id: string;
  pending: "update" | "delete";
  originalStatus?: string;
}

interface ActionItemsStore {
  optimistic: OptimisticActionItem[];
  addOptimistic: (item: OptimisticActionItem) => void;
  removeOptimistic: (id: string) => void;
}

export const useActionItemsStore = create<ActionItemsStore>((set) => ({
  optimistic: [],
  addOptimistic: (item) =>
    set((s) => ({ optimistic: [...s.optimistic, item] })),
  removeOptimistic: (id) =>
    set((s) => ({ optimistic: s.optimistic.filter((i) => i.id !== id) })),
}));
