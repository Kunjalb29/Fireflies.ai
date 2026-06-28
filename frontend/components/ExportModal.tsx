"use client";
/**
 * Export Modal — PDF, Markdown, and TXT client-side exports.
 */
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Download, File } from "lucide-react";
import { formatAbsoluteDate, formatDuration, formatSeconds } from "@/lib/utils";
import type { MeetingDetail } from "@/types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingDetail;
}

function buildMarkdown(meeting: MeetingDetail): string {
  const lines: string[] = [];
  lines.push(`# ${meeting.title}`);
  lines.push(`**Date:** ${formatAbsoluteDate(meeting.date)}`);
  lines.push(`**Duration:** ${formatDuration(meeting.duration_secs)}`);
  lines.push(`**Participants:** ${(meeting.participants || []).join(", ")}`);
  lines.push("");

  if (meeting.summary) {
    lines.push("## Summary");
    if (meeting.summary.overview) lines.push(meeting.summary.overview);
    lines.push("");
    if (meeting.summary.key_points?.length) {
      lines.push("### Key Points");
      meeting.summary.key_points.forEach((p) => lines.push(`- ${p}`));
      lines.push("");
    }
    if (meeting.summary.chapters?.length) {
      lines.push("### Chapters");
      meeting.summary.chapters.forEach((c) => {
        lines.push(`**${c.title}** (${formatSeconds(c.start_seconds)})`);
        lines.push(c.summary);
        lines.push("");
      });
    }
  }

  if (meeting.action_items?.length) {
    lines.push("## Action Items");
    meeting.action_items.forEach((a) => {
      const status = a.status === "done" ? "[x]" : "[ ]";
      lines.push(`- ${status} ${a.text}${a.assignee ? ` — ${a.assignee}` : ""}${a.due_date ? ` (due ${a.due_date})` : ""}`);
    });
    lines.push("");
  }

  if (meeting.transcript?.segments?.length) {
    lines.push("## Transcript");
    meeting.transcript.segments.forEach((s) => {
      const ts = s.start_time !== null ? `[${formatSeconds(s.start_time)}]` : "";
      lines.push(`**${s.speaker_name}** ${ts}`);
      lines.push(s.text);
      lines.push("");
    });
  }

  return lines.join("\n");
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(meeting: MeetingDetail) {
  // Use browser print as PDF fallback (jsPDF would need more setup for full styling)
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(`
    <html><head>
      <title>${meeting.title}</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #111; line-height: 1.6; }
        h1, h2, h3 { color: #1a1a2e; }
        pre { background: #f5f5f5; padding: 12px; border-radius: 6px; font-size: 12px; overflow: auto; }
      </style>
    </head><body>
      <h1>${meeting.title}</h1>
      <p><strong>Date:</strong> ${formatAbsoluteDate(meeting.date)} | <strong>Duration:</strong> ${formatDuration(meeting.duration_secs)}</p>
      <p><strong>Participants:</strong> ${(meeting.participants || []).join(", ")}</p>
      ${meeting.summary ? `
        <h2>Summary</h2>
        <p>${meeting.summary.overview || ""}</p>
        ${meeting.summary.key_points?.length ? `<h3>Key Points</h3><ul>${meeting.summary.key_points.map((p) => `<li>${p}</li>`).join("")}</ul>` : ""}
      ` : ""}
      ${meeting.action_items?.length ? `
        <h2>Action Items</h2>
        <ul>${meeting.action_items.map((a) => `<li>${a.status === "done" ? "☑" : "☐"} ${a.text}${a.assignee ? ` — ${a.assignee}` : ""}</li>`).join("")}</ul>
      ` : ""}
      ${meeting.transcript?.segments?.length ? `
        <h2>Transcript</h2>
        ${meeting.transcript.segments.map((s) => `
          <p><strong>${s.speaker_name}</strong> <small>${s.start_time !== null ? `[${formatSeconds(s.start_time)}]` : ""}</small><br/>${s.text}</p>
        `).join("")}
      ` : ""}
    </body></html>
  `);
  printWindow.document.close();
  printWindow.print();
}

export function ExportModal({ isOpen, onClose, meeting }: ExportModalProps) {
  const slug = meeting.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleExport = (type: "pdf" | "md" | "txt") => {
    if (type === "pdf") {
      exportPDF(meeting);
    } else if (type === "md") {
      downloadFile(buildMarkdown(meeting), `${slug}.md`, "text/markdown");
    } else {
      downloadFile(buildMarkdown(meeting).replace(/[#*_]/g, ""), `${slug}.txt`, "text/plain");
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative card p-6 w-full max-w-sm glass"
          >
            <button onClick={onClose} className="absolute top-4 right-4 btn-ghost btn-icon">
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-semibold text-white mb-1">Export Meeting</h2>
            <p className="text-sm text-text-muted-dark mb-5">Choose a format to download</p>

            <div className="space-y-2">
              {[
                { type: "pdf" as const, label: "Export as PDF", desc: "Print-ready formatted document", icon: File },
                { type: "md" as const, label: "Export as Markdown", desc: "Structured .md file", icon: FileText },
                { type: "txt" as const, label: "Export as Text", desc: "Plain text file", icon: Download },
              ].map(({ type, label, desc, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => handleExport(type)}
                  className="w-full flex items-center gap-3 p-3 rounded-button bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-primary/30 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-button bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">{label}</p>
                    <p className="text-[11px] text-text-muted-dark">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
