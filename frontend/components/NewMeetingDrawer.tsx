"use client";
/**
 * New Meeting drawer/form — slide-over for creating meetings.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMeeting } from "@/lib/services";
import { SlideOverDrawer } from "@/components/SlideOverDrawer";
import { useRouter } from "next/navigation";
import { X, Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface NewMeetingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type TranscriptTab = "paste" | "upload";

export function NewMeetingDrawer({ isOpen, onClose }: NewMeetingDrawerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [durationMins, setDurationMins] = useState(30);
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantInput, setParticipantInput] = useState("");
  const [transcriptTab, setTranscriptTab] = useState<TranscriptTab>("paste");
  const [transcriptText, setTranscriptText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (formData: FormData) => createMeeting(formData),
    onSuccess: (data) => {
      toast.success("Meeting created!");
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      handleClose();
      router.push(`/meetings/${data.id}`);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create meeting"),
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Meeting title is required";
    if (participants.length === 0) e.participants = "Add at least one participant";
    if (transcriptTab === "paste" && !transcriptText.trim()) e.transcript = "Transcript text is required";
    if (transcriptTab === "upload" && !file) e.transcript = "Please upload a transcript file";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("date", new Date(date).toISOString());
    formData.append("duration_secs", String(durationMins * 60));
    formData.append("participants", JSON.stringify(participants));

    if (transcriptTab === "paste") {
      formData.append("transcript_text", transcriptText);
    } else if (file) {
      formData.append("transcript_file", file);
    }

    mutation.mutate(formData);
  };

  const addParticipant = () => {
    const val = participantInput.trim();
    if (val && !participants.includes(val)) {
      setParticipants([...participants, val]);
      setParticipantInput("");
    }
  };

  const handleClose = () => {
    setTitle("");
    setParticipants([]);
    setParticipantInput("");
    setTranscriptText("");
    setFile(null);
    setErrors({});
    onClose();
  };

  return (
    <SlideOverDrawer isOpen={isOpen} onClose={handleClose} title="New Meeting">
      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-text-muted-dark mb-1.5 uppercase tracking-wide">
            Meeting Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Q3 Product Review"
            className={cn("input w-full", errors.title && "border-danger/50")}
            id="meeting-title-input"
          />
          {errors.title && <p className="text-[11px] text-danger mt-1">{errors.title}</p>}
        </div>

        {/* Date & Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted-dark mb-1.5 uppercase tracking-wide">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted-dark mb-1.5 uppercase tracking-wide">
              Duration (mins)
            </label>
            <input
              type="number"
              min={1}
              value={durationMins}
              onChange={(e) => setDurationMins(parseInt(e.target.value) || 0)}
              className="input w-full"
            />
          </div>
        </div>

        {/* Participants */}
        <div>
          <label className="block text-xs font-semibold text-text-muted-dark mb-1.5 uppercase tracking-wide">
            Participants *
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={participantInput}
              onChange={(e) => setParticipantInput(e.target.value)}
              placeholder="Name or email, then press Enter"
              className={cn("input flex-1", errors.participants && "border-danger/50")}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addParticipant(); } }}
            />
            <button onClick={addParticipant} className="btn-secondary px-3">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {errors.participants && <p className="text-[11px] text-danger mb-1">{errors.participants}</p>}
          {participants.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {participants.map((p) => (
                <span key={p} className="chip text-xs">
                  {p}
                  <button onClick={() => setParticipants(participants.filter((x) => x !== p))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Transcript */}
        <div>
          <label className="block text-xs font-semibold text-text-muted-dark mb-1.5 uppercase tracking-wide">
            Transcript *
          </label>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] mb-3">
            {(["paste", "upload"] as TranscriptTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setTranscriptTab(tab)}
                className={cn(
                  "px-4 py-2 text-xs font-medium border-b-2 transition-colors capitalize",
                  transcriptTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted-dark hover:text-white"
                )}
              >
                {tab === "paste" ? "Paste Text" : "Upload File"}
              </button>
            ))}
          </div>

          {transcriptTab === "paste" ? (
            <textarea
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              rows={10}
              placeholder={`[00:00] Speaker Name: Welcome everyone...\n[00:15] Another Speaker: Thanks for joining...`}
              className={cn("input w-full font-mono text-xs resize-none leading-relaxed", errors.transcript && "border-danger/50")}
            />
          ) : (
            <label className={cn(
              "flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-card p-8 cursor-pointer transition-colors",
              file ? "border-primary/50 bg-primary/5" : "border-white/10 hover:border-primary/30",
              errors.transcript && "border-danger/50"
            )}>
              <Upload className="w-8 h-8 text-text-muted-dark" />
              <div className="text-center">
                <p className="text-sm text-white font-medium">
                  {file ? file.name : "Drop file or click to upload"}
                </p>
                <p className="text-xs text-text-muted-dark mt-0.5">.txt, .vtt, .json accepted</p>
              </div>
              <input
                type="file"
                accept=".txt,.vtt,.json"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          )}
          {errors.transcript && <p className="text-[11px] text-danger mt-1">{errors.transcript}</p>}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button onClick={handleClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="btn-primary flex-1"
            id="create-meeting-submit"
          >
            {mutation.isPending ? "Creating…" : "Create Meeting"}
          </button>
        </div>
      </div>
    </SlideOverDrawer>
  );
}
