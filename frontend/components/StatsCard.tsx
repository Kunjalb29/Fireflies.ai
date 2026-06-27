"use client";
/**
 * StatsCard Component — Dashboard metric card with number, label, icon, and trend.
 */
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatsCard({ label, value, icon: Icon, iconColor = "text-primary", trend, className }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("stats-card", className)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-text-muted-dark uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={cn("w-10 h-10 rounded-card bg-white/5 flex items-center justify-center", iconColor.replace("text-", "bg-").replace("primary", "primary/10").replace("accent", "accent/10"))}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-1">
          {trend.value >= 0 ? (
            <TrendingUp className="w-3 h-3 text-success" />
          ) : (
            <TrendingDown className="w-3 h-3 text-danger" />
          )}
          <span className={cn("text-xs", trend.value >= 0 ? "text-success" : "text-danger")}>
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
          </span>
        </div>
      )}
    </motion.div>
  );
}
