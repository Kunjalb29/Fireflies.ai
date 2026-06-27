"use client";
/**
 * App layout shared by all authenticated pages (/meetings, /search, etc.)
 * Includes sidebar, top bar, and search modal.
 */
import { Sidebar } from "@/components/Sidebar";
import { SearchModal } from "@/components/SearchModal";
import { useUIStore } from "@/store";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, toggleMobileSidebar } = useUIStore();

  return (
    <div className="min-h-screen bg-bg-dark flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-surface-dark/90 border-b border-white/[0.06] flex items-center px-4 md:hidden z-20">
        <button
          onClick={toggleMobileSidebar}
          className="btn-ghost btn-icon mr-2"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-bold text-white">MeetMind</span>
      </div>

      {/* Main content */}
      <main
        className={cn(
          "flex-1 min-h-screen transition-all duration-300",
          "pt-14 md:pt-0",
        )}
        style={{
          marginLeft: sidebarCollapsed ? "64px" : "240px",
        }}
      >
        <div className="max-w-7xl mx-auto page-enter">
          {children}
        </div>
      </main>

      {/* Global search modal */}
      <SearchModal />
    </div>
  );
}
