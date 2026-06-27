"use client";
/**
 * Global Search Modal — Cmd+K search with real-time results and recent searches.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, FileText, CheckSquare, X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store";
import { globalSearch } from "@/lib/services";
import { addRecentSearch, getRecentSearches, formatRelativeDate } from "@/lib/utils";
import type { SearchResultItem, SearchResults } from "@/types";
import { useDebounce } from "@/lib/hooks";

export function SearchModal() {
  const { searchModalOpen, setSearchModalOpen } = useUIStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches
  useEffect(() => {
    if (searchModalOpen) {
      setRecentSearches(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [searchModalOpen]);

  // Search on debounced query
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null);
      return;
    }
    setIsLoading(true);
    globalSearch(debouncedQuery)
      .then(setResults)
      .catch(() => setResults(null))
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen(true);
      }
      if (e.key === "Escape") setSearchModalOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [setSearchModalOpen]);

  const navigateTo = (item: SearchResultItem) => {
    addRecentSearch(query || item.title);
    setSearchModalOpen(false);
    if (item.type === "transcript") {
      router.push(`/meetings/${item.meeting_id}?highlight=${item.id}`);
    } else if (item.type === "action_item") {
      router.push(`/meetings/${item.meeting_id}`);
    } else {
      router.push(`/meetings/${item.meeting_id}`);
    }
  };

  const totalResults = results
    ? results.meetings.length + results.transcripts.length + results.action_items.length
    : 0;

  return (
    <AnimatePresence>
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSearchModalOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-2xl glass rounded-card overflow-hidden shadow-2xl"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08]">
              <Search className="w-5 h-5 text-text-muted-dark shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search meetings, transcripts, action items…"
                className="flex-1 bg-transparent text-white placeholder:text-text-muted-dark focus:outline-none text-base"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="btn-ghost btn-icon p-1"
                >
                  <X className="w-4 h-4 text-text-muted-dark" />
                </button>
              )}
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white/5 border border-white/10 rounded text-text-muted-dark font-mono">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {isLoading && (
                <div className="p-4 text-center text-sm text-text-muted-dark">
                  Searching…
                </div>
              )}

              {!isLoading && query.length < 2 && (
                <div className="p-4">
                  {recentSearches.length > 0 && (
                    <>
                      <p className="text-[11px] font-semibold text-text-muted-dark uppercase tracking-wide mb-2 px-1">
                        Recent
                      </p>
                      {recentSearches.map((s) => (
                        <button
                          key={s}
                          onClick={() => setQuery(s)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-button hover:bg-white/5 text-left transition-colors"
                        >
                          <Clock className="w-4 h-4 text-text-muted-dark" />
                          <span className="text-sm text-text-muted-dark">{s}</span>
                        </button>
                      ))}
                    </>
                  )}
                  {recentSearches.length === 0 && (
                    <p className="text-center text-sm text-text-muted-dark py-6">
                      Start typing to search across all your meetings…
                    </p>
                  )}
                </div>
              )}

              {!isLoading && results && totalResults === 0 && (
                <div className="p-8 text-center text-sm text-text-muted-dark">
                  No results for "{query}"
                </div>
              )}

              {!isLoading && results && totalResults > 0 && (
                <div className="py-2">
                  {/* Meetings */}
                  {results.meetings.length > 0 && (
                    <ResultSection title="Meetings">
                      {results.meetings.map((item) => (
                        <ResultRow key={item.id} item={item} query={query} onClick={() => navigateTo(item)} icon={<FileText className="w-4 h-4" />} />
                      ))}
                    </ResultSection>
                  )}

                  {/* Transcripts */}
                  {results.transcripts.length > 0 && (
                    <ResultSection title="Transcript Matches">
                      {results.transcripts.map((item) => (
                        <ResultRow key={item.id} item={item} query={query} onClick={() => navigateTo(item)} icon={<FileText className="w-4 h-4 text-accent" />} showSnippet />
                      ))}
                    </ResultSection>
                  )}

                  {/* Action Items */}
                  {results.action_items.length > 0 && (
                    <ResultSection title="Action Items">
                      {results.action_items.map((item) => (
                        <ResultRow key={item.id} item={item} query={query} onClick={() => navigateTo(item)} icon={<CheckSquare className="w-4 h-4 text-success" />} />
                      ))}
                    </ResultSection>
                  )}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-white/[0.06] flex items-center gap-4 text-[11px] text-text-muted-dark">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>ESC close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-4 py-1.5 text-[11px] font-semibold text-text-muted-dark uppercase tracking-wide">
        {title}
      </p>
      {children}
    </div>
  );
}

function ResultRow({ item, query, onClick, icon, showSnippet }: {
  item: SearchResultItem;
  query: string;
  onClick: () => void;
  icon: React.ReactNode;
  showSnippet?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-white/5 text-left transition-colors group"
    >
      <div className="mt-0.5 text-text-muted-dark shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate group-hover:text-primary transition-colors">
          {item.title}
        </p>
        {showSnippet && item.snippet && (
          <p className="text-xs text-text-muted-dark mt-0.5 line-clamp-2">
            {item.snippet}
          </p>
        )}
        {item.date && (
          <p className="text-[11px] text-text-muted-dark mt-0.5">
            {formatRelativeDate(item.date)}
          </p>
        )}
      </div>
      <ArrowRight className="w-4 h-4 text-text-muted-dark opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
    </button>
  );
}
