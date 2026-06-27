"use client";
/**
 * Settings Page — /settings
 * Theme toggle, account info, integrations (coming soon), upgrade CTA.
 */
import { motion } from "framer-motion";
import { Moon, Sun, Crown, Zap, Plug, Bell, Shield, LogOut, ChevronRight } from "lucide-react";
import { useThemeStore } from "@/store";
import { cn } from "@/lib/utils";

const PLAN_FEATURES = {
  free: {
    name: "Free Plan",
    color: "text-text-muted-dark",
    features: ["5 meetings / month", "3 AI summaries", "Basic search"],
  },
  pro: {
    name: "Pro Plan",
    color: "text-primary",
    features: ["Unlimited meetings", "Unlimited AI summaries", "Advanced search", "Export PDF/MD", "Priority support"],
  },
};

const INTEGRATIONS = [
  { name: "Google Calendar", desc: "Auto-import meetings", icon: "📅", available: false },
  { name: "Zoom", desc: "Record and transcribe Zoom calls", icon: "💻", available: false },
  { name: "Microsoft Teams", desc: "Capture Teams meetings", icon: "🟦", available: false },
  { name: "Slack", desc: "Share summaries in Slack", icon: "💬", available: false },
];

export default function SettingsPage() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Profile section */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <h2 className="text-sm font-semibold text-text-muted-dark uppercase tracking-wide mb-4">Account</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold shadow-glow">
              AC
            </div>
            <div>
              <p className="font-semibold text-white text-lg">Alex Chen</p>
              <p className="text-sm text-text-muted-dark">demo@meetmind.ai</p>
              <span className="badge-primary text-[11px] mt-1 inline-flex items-center gap-1">
                <Crown className="w-3 h-3" /> Pro Plan
              </span>
            </div>
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-5">
          <h2 className="text-sm font-semibold text-text-muted-dark uppercase tracking-wide mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Theme</p>
              <p className="text-xs text-text-muted-dark mt-0.5">Switch between dark and light mode</p>
            </div>
            <button
              onClick={toggleTheme}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-button border transition-all",
                theme === "dark"
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              )}
              id="theme-toggle-btn"
            >
              {theme === "dark" ? (
                <><Moon className="w-4 h-4" /> Dark Mode</>
              ) : (
                <><Sun className="w-4 h-4" /> Light Mode</>
              )}
            </button>
          </div>
        </motion.div>

        {/* Plan */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="upgrade-banner rounded-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-muted-dark uppercase tracking-wide">Current Plan</h2>
              <p className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Pro Plan — $12/mo
              </p>
            </div>
            <span className="badge-primary">Active</span>
          </div>
          <ul className="space-y-1.5 mb-4">
            {PLAN_FEATURES.pro.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button className="btn-secondary btn-sm w-full">
            Manage subscription
          </button>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5">
          <h2 className="text-sm font-semibold text-text-muted-dark uppercase tracking-wide mb-4">Notifications</h2>
          <div className="space-y-3">
            {[
              { label: "Email summaries", desc: "Receive AI summaries by email after each meeting" },
              { label: "Action item reminders", desc: "Get reminded of upcoming due dates" },
              { label: "Weekly digest", desc: "Summary of all meetings from the past week" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{item.label}</p>
                  <p className="text-xs text-text-muted-dark">{item.desc}</p>
                </div>
                <button
                  className="w-11 h-6 rounded-full bg-primary/20 border border-primary/30 relative transition-colors"
                  aria-label={`Toggle ${item.label}`}
                >
                  <div className="w-4 h-4 rounded-full bg-primary absolute top-1 left-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Integrations */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-muted-dark uppercase tracking-wide">Integrations</h2>
            <span className="badge-accent text-[10px]">Coming Soon</span>
          </div>
          <div className="space-y-2">
            {INTEGRATIONS.map((integration) => (
              <div
                key={integration.name}
                className="flex items-center gap-3 p-3 rounded-button bg-white/[0.02] border border-white/[0.06] opacity-60"
              >
                <span className="text-xl">{integration.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{integration.name}</p>
                  <p className="text-xs text-text-muted-dark">{integration.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted-dark" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-5">
          <h2 className="text-sm font-semibold text-text-muted-dark uppercase tracking-wide mb-4">Security</h2>
          <div className="space-y-2">
            {[
              { icon: Shield, label: "Change password", desc: "Update your account password" },
              { icon: LogOut, label: "Sign out", desc: "Sign out of MeetMind on this device" },
            ].map(({ icon: Icon, label, desc }) => (
              <button
                key={label}
                className="w-full flex items-center gap-3 p-3 rounded-button hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-button bg-white/5 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-text-muted-dark" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-text-muted-dark">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted-dark ml-auto" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
