"use client";
/**
 * ActionItemCard Component
 * Full-featured action item with checkbox, inline edit, assignee, due date, priority.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, Pencil, Calendar, User, Flag } from "lucide-react";
import { cn, formatDueDate, getPriorityConfig } from "@/lib/utils";
import type { ActionItem, Priority } from "@/types";

interface ActionItemCardProps {
  item: ActionItem;
  onToggle: (id: string, currentStatus: string) => void;
  onUpdate: (id: string, data: Partial<ActionItem>) => void;
  onDelete: (id: string) => void;
  isPending?: boolean;
}

export function ActionItemCard({ item, onToggle, onUpdate, onDelete, isPending }: ActionItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const isDone = item.status === "done";
  const priorityCfg = getPriorityConfig(item.priority as Priority);

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== item.text) {
      onUpdate(item.id, { text: editText.trim() });
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "group flex items-start gap-3 p-3 rounded-button hover:bg-white/[0.02] transition-all duration-150",
        isPending && "opacity-60"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id, item.status)}
        className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150",
          isDone
            ? "bg-success border-success text-white"
            : "border-white/20 hover:border-primary"
        )}
        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
      >
        {isDone && <Check className="w-3 h-3" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit();
              if (e.key === "Escape") { setEditText(item.text); setIsEditing(false); }
            }}
            className="input text-sm w-full"
            autoFocus
          />
        ) : (
          <p
            className={cn(
              "text-sm text-white leading-snug cursor-text hover:text-primary/80 transition-colors",
              isDone && "line-through text-text-muted-dark"
            )}
            onClick={() => setIsEditing(true)}
          >
            {item.text}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center flex-wrap gap-2 mt-1.5">
          {item.assignee && (
            <span className="flex items-center gap-1 text-[11px] text-text-muted-dark">
              <User className="w-3 h-3" />
              {item.assignee}
            </span>
          )}
          {item.due_date && (
            <span className="flex items-center gap-1 text-[11px] text-text-muted-dark">
              <Calendar className="w-3 h-3" />
              {formatDueDate(item.due_date)}
            </span>
          )}
          <span className={cn("badge text-[10px] border px-1.5 py-0", priorityCfg.className)}>
            <Flag className="w-2.5 h-2.5 inline mr-0.5" />
            {priorityCfg.label}
          </span>
        </div>
      </div>

      {/* Actions (on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => setIsEditing(true)}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Edit action item"
        >
          <Pencil className="w-3 h-3 text-text-muted-dark" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-danger/20 transition-colors"
          aria-label="Delete action item"
        >
          <Trash2 className="w-3 h-3 text-danger" />
        </button>
      </div>
    </motion.div>
  );
}
