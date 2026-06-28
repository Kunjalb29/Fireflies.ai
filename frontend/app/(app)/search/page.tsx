"use client";
/**
 * Search Page — /search?q=...
 * Full-page search with grouped results.
 */
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, FileText, CheckSquare, ArrowRight, Mic } from "lucide-react";
import { globalSearch } from "@/lib/services";
import { useDebounce } from "@/lib/hooks";
import { formatRelativeDate } from "@/lib/utils";
import { SkeletonCard } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => globalSearch(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  // Update URL on query change
  useEffect(() => {
    if (debouncedQuery) {
      router.replace(`/search?q=${encodeURIComponent(debouncedQuery)}`, { scroll: false });
    }
  }, [debouncedQuery, router]);

  const totalResults = data
    ? data.meetings.length + data.transcripts.length + data.action_items.length
    : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Search</h1>

      {/* Search input */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted-dark" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search meetings, transcripts, action items…"
          className="input input-lg pl-12 w-full text-base"
          autoFocus
          id="search-page-input"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted-dark hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results */}
      {query.length < 2 ? (
        <EmptyState
          icon={Search}
          title="Search your meetings"
          description="Type at least 2 characters to search across meeting titles, transcripts, and action items."
        />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : totalResults === 0 ? (
        <EmptyState
          icon={Search}
          title={`No results for "${query}"`}
          description="Try different keywords or check the spelling."
        />
      ) : (
        <div className="space-y-8">
          {/* Meeting results */}
          {data?.meetings && data.meetings.length > 0 && (
            <ResultGroup title="Meetings" count={data.meetings.length}>
              {data.meetings.map((item) => (
                <ResultCard
                  key={item.id}
                  href={`/meetings/${item.meeting_id}`}
                  title={item.title}
                  subtitle={item.date ? formatRelativeDate(item.date) : ""}
                  icon={<FileText className="w-4 h-4 text-primary" />}
                />
              ))}
            </ResultGroup>
          )}

          {/* Transcript results */}
          {data?.transcripts && data.transcripts.length > 0 && (
            <ResultGroup title="Transcript Matches" count={data.transcripts.length}>
              {data.transcripts.map((item) => (
                <ResultCard
                  key={item.id}
                  href={`/meetings/${item.meeting_id}?highlight=${item.id}`}
                  title={item.title}
                  snippet={item.snippet || undefined}
                  subtitle={`${(item as unknown as { speaker_name?: string }).speaker_name || ""} · ${item.date ? formatRelativeDate(item.date) : ""}`}
                  icon={<Mic className="w-4 h-4 text-accent" />}
                />
              ))}
            </ResultGroup>
          )}

          {/* Action item results */}
          {data?.action_items && data.action_items.length > 0 && (
            <ResultGroup title="Action Items" count={data.action_items.length}>
              {data.action_items.map((item) => (
                <ResultCard
                  key={item.id}
                  href={`/meetings/${item.meeting_id}`}
                  title={item.snippet || item.title}
                  subtitle={`In: ${item.title} · ${item.date ? formatRelativeDate(item.date) : ""}`}
                  icon={<CheckSquare className="w-4 h-4 text-success" />}
                />
              ))}
            </ResultGroup>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Search</h1>
        <div className="space-y-3">
          <div className="h-12 bg-white/5 rounded-input w-full mb-8 animate-pulse" />
          <div className="h-24 bg-white/5 rounded-card w-full animate-pulse" />
          <div className="h-24 bg-white/5 rounded-card w-full animate-pulse" />
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}

function ResultGroup({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-text-muted-dark uppercase tracking-wide">{title}</h2>
        <span className="badge-neutral text-[10px]">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ResultCard({
  href, title, subtitle, snippet, icon
}: {
  href: string;
  title: string;
  subtitle?: string;
  snippet?: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ x: 2 }}
        className="flex items-start gap-3 p-4 card hover:border-primary/20 hover:bg-primary/[0.02] transition-all group"
      >
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white group-hover:text-primary transition-colors truncate">
            {title}
          </p>
          {snippet && (
            <p className="text-xs text-text-muted-dark mt-0.5 line-clamp-2">{snippet}</p>
          )}
          {subtitle && (
            <p className="text-[11px] text-text-muted-dark mt-1">{subtitle}</p>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-text-muted-dark opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
      </motion.div>
    </Link>
  );
}
