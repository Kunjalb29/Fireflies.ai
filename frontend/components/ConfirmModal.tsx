"use client";
/**
 * ConfirmModal — Reusable danger confirmation dialog.
 */
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen, title, description, confirmLabel = "Delete",
  onConfirm, onCancel, isLoading
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.2 }}
            className="relative card p-6 w-full max-w-md glass"
          >
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 btn-ghost btn-icon"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-card bg-danger/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <h2 className="text-lg font-semibold text-white">{title}</h2>
            </div>

            <p className="text-sm text-text-muted-dark mb-6 leading-relaxed">{description}</p>

            <div className="flex gap-3 justify-end">
              <button onClick={onCancel} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="btn-danger"
              >
                {isLoading ? "Deleting…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
