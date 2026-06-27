"use client";
/**
 * MediaPlayer Component
 * Custom HTML5 audio player with styled controls.
 * Syncs with Zustand player store for transcript segment highlighting.
 */
import { useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react";
import { usePlayerStore } from "@/store";
import { formatSeconds, cn } from "@/lib/utils";
import type { TranscriptSegment } from "@/types";

interface MediaPlayerProps {
  audioUrl?: string | null;
  segments?: TranscriptSegment[];
  className?: string;
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

export function MediaPlayer({ audioUrl, segments = [], className }: MediaPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    isPlaying, currentTime, duration, volume, playbackRate,
    setPlaying, setCurrentTime, setDuration, setVolume, setPlaybackRate,
    setActiveSegment, seekTarget, clearSeekTarget,
  } = usePlayerStore();

  // Sync seek target from store
  useEffect(() => {
    if (seekTarget !== null && audioRef.current) {
      audioRef.current.currentTime = seekTarget;
      clearSeekTarget();
    }
  }, [seekTarget, clearSeekTarget]);

  // Update active segment based on current time
  useEffect(() => {
    const active = segments.find(
      (s) => s.start_time !== null && s.end_time !== null &&
        currentTime >= s.start_time && currentTime <= s.end_time
    );
    setActiveSegment(active?.id || null);
  }, [currentTime, segments, setActiveSegment]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }, [isPlaying]);

  // Keyboard shortcut: Space to play/pause
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [togglePlay]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const cyclePlaybackRate = () => {
    const idx = PLAYBACK_RATES.indexOf(playbackRate);
    const next = PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length];
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const skip = (secs: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + secs));
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn("card p-4", className)}>
      {/* Hidden audio element */}
      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      ) : (
        /* Mock player when no audio source */
        <div />
      )}

      <div className="flex items-center gap-4">
        {/* Play/Pause + Skip controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => skip(-10)}
            className="btn-ghost btn-icon text-text-muted-dark"
            aria-label="Skip back 10 seconds"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center transition-colors shadow-glow"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white ml-0.5" />
            )}
          </button>

          <button
            onClick={() => skip(10)}
            className="btn-ghost btn-icon text-text-muted-dark"
            aria-label="Skip forward 10 seconds"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Current time */}
        <span className="font-mono text-xs text-text-muted-dark shrink-0 w-10">
          {formatSeconds(currentTime)}
        </span>

        {/* Seek bar */}
        <div className="flex-1 relative">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="seek-bar w-full h-1 cursor-pointer"
            style={{ "--progress": `${progress}%` } as React.CSSProperties}
            aria-label="Seek"
          />
        </div>

        {/* Duration */}
        <span className="font-mono text-xs text-text-muted-dark shrink-0 w-10 text-right">
          {formatSeconds(duration)}
        </span>

        {/* Playback rate */}
        <button
          onClick={cyclePlaybackRate}
          className="btn-ghost btn-sm font-mono text-xs text-text-muted-dark shrink-0 min-w-[36px]"
          aria-label={`Playback rate ${playbackRate}x`}
        >
          {playbackRate}x
        </button>

        {/* Volume */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => { setVolume(volume > 0 ? 0 : 1); if (audioRef.current) audioRef.current.volume = volume > 0 ? 0 : 1; }}
            className="btn-ghost btn-icon text-text-muted-dark"
            aria-label="Toggle mute"
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolumeChange}
            className="seek-bar w-16 h-1"
            style={{ "--progress": `${volume * 100}%` } as React.CSSProperties}
            aria-label="Volume"
          />
        </div>
      </div>

      {/* No audio notice */}
      {!audioUrl && (
        <p className="text-[11px] text-text-muted-dark mt-2 text-center">
          No audio file attached. Upload a meeting recording to enable playback.
        </p>
      )}
    </div>
  );
}
