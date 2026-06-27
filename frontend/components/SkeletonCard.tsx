"use client";
/**
 * SkeletonCard and SkeletonLine components for loading states.
 */
import { cn } from "@/lib/utils";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("card p-5 space-y-3", className)}>
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-5 w-3/4" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonBlock className="h-10 w-full" />
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <SkeletonBlock className="w-6 h-6 rounded-full" />
          <SkeletonBlock className="w-6 h-6 rounded-full" />
          <SkeletonBlock className="w-6 h-6 rounded-full" />
        </div>
        <div className="flex gap-1">
          <SkeletonBlock className="w-12 h-5 rounded-full" />
          <SkeletonBlock className="w-16 h-5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStatsCard({ className }: { className?: string }) {
  return (
    <div className={cn("stats-card", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-7 w-16" />
        </div>
        <SkeletonBlock className="w-10 h-10 rounded-card" />
      </div>
    </div>
  );
}

export function SkeletonTranscriptSegment({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 space-y-2", className)}>
      <div className="flex items-center gap-2">
        <SkeletonBlock className="w-8 h-8 rounded-full" />
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-3 w-12 ml-auto" />
      </div>
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-3 w-4/5" />
    </div>
  );
}
