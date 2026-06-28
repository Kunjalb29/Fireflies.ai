"use client";
/**
 * Sidebar Navigation Component
 * Collapsible sidebar with nav items, upgrade banner, and user profile.
 * Supports tooltip hints in collapsed mode.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Search, CheckSquare, Settings, ChevronLeft,
  ChevronRight, Sparkles, Radio, Crown
} from "lucide-react";
import { useUIStore } from "@/store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/meetings", icon: LayoutDashboard, label: "Meetings" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/action-items", icon: CheckSquare, label: "Action Items" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, toggleMobileSidebar } = useUIStore();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            onClick={toggleMobileSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "sidebar",
          sidebarCollapsed && "collapsed",
          sidebarMobileOpen && "mobile-open",
          className
        )}
        style={{
          width: sidebarCollapsed ? "64px" : "240px",
        }}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-white/[0.06] shrink-0">
          <Link href="/meetings" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-glow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-bold text-lg text-white overflow-hidden whitespace-nowrap"
                >
                  MeetMind
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <div key={href} className="relative group">
              <Link
                href={href}
                className={cn(
                  "nav-item",
                  isActive(href) && "active",
                  sidebarCollapsed && "justify-center px-2"
                )}
                aria-label={label}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
              {/* Tooltip in collapsed mode */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-surface-card border border-white/10 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {label}
                </div>
              )}
            </div>
          ))}

          {/* Live Call (coming soon) */}
          <div className="relative group mt-2">
            <button
              className={cn(
                "nav-item w-full",
                sidebarCollapsed && "justify-center px-2"
              )}
              onClick={() => {
                // Handled by upgrade/coming-soon modal
              }}
              aria-label="Join live call"
            >
              <div className="relative shrink-0">
                <Radio className="w-5 h-5 text-accent" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
              </div>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="overflow-hidden whitespace-nowrap text-accent"
                  >
                    Live Call
                    <span className="ml-1.5 text-[10px] badge-accent px-1 py-0 rounded">SOON</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </nav>

        {/* Upgrade Banner (shown for non-pro) */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-2 mb-2 p-3 upgrade-banner rounded-card"
            >
              <p className="text-xs font-semibold text-white mb-1">Upgrade to Pro</p>
              <p className="text-[11px] text-text-muted-dark mb-2">
                Unlimited meetings, AI summaries, advanced search
              </p>
              <Link
                href="/pricing"
                className="btn-primary btn-sm w-full justify-center text-[11px]"
              >
                Upgrade — $12/mo
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Profile */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-3 border-t border-white/[0.06] shrink-0",
          sidebarCollapsed && "justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 text-white text-xs font-bold">
            AC
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-white truncate">Alex Chen</span>
                  <span className="badge-primary text-[10px] px-1.5 py-0 rounded">
                    <Crown className="w-2.5 h-2.5 inline" /> Pro
                  </span>
                </div>
                <p className="text-[11px] text-text-muted-dark truncate">demo@meetmind.ai</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface-card border border-white/10 flex items-center justify-center hover:bg-surface-hover transition-colors z-10 hidden md:flex"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3 h-3 text-text-muted-dark" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-text-muted-dark" />
          )}
        </button>
      </aside>
    </>
  );
}
