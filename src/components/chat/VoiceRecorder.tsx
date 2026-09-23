"use client";

import * as React from "react";
import { Send, Trash2 } from "lucide-react";

export const MAX_VOICE_SECONDS = 30;

/** First supported recording mime (Chrome → webm, Safari → mp4). */
export function pickVoiceMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const m of ["audio/webm", "audio/mp4", "audio/ogg"]) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function formatVoiceTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `0:${String(s).padStart(2, "0")}`;
}

/**
 * Tap-to-record voice note (30s cap, auto-stops). Emits the raw blob —
 * the parent packs + sends it like any other ephemeral attachment.
 */
export function VoiceRecorder({
  disabled = false,
  onSend,
  onCancel,
}: {
  disabled?: boolean;
  onSend: (blob: Blob, durationSec: number) => void;
  onCancel: () => void;
}) {
  const [recording, setRecording] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<number | null>(null);
  const startedAtRef = React.useRef(0);

  const stopTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  /** Cap reached: stop capturing but stay on the review row (send/delete). */
  const stopCapture = React.useCallback(() => {
    stopTimer();
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.onstop = null;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    }
    rec?.stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const teardown = React.useCallback(() => {
    stopTimer();
    const rec = recorderRef.current;
    recorderRef.current = null;
    if (rec && rec.state !== "inactive") {
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    }
    rec?.stream?.getTracks().forEach((t) => t.stop());
  }, []);

  React.useEffect(() => teardown, [teardown]);

  const start = async () => {
    setError(null);
    const mime = pickVoiceMime();
    if (!mime) {
      setError("Voice notes aren't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.start(250);
      recorderRef.current = rec;
      startedAtRef.current = Date.now();
      setElapsed(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        const s = (Date.now() - startedAtRef.current) / 1000;
        setElapsed(s);
        if (s >= MAX_VOICE_SECONDS) stopCapture();
      }, 200);
    } catch {
      setError("Microphone blocked — allow access to record.");
    }
  };

  const finish = (send: boolean) => {
    const rec = recorderRef.current;
    const secs = (Date.now() - startedAtRef.current) / 1000;
    stopTimer();
    setRecording(false);
    if (!rec) {
      onCancel();
      return;
    }
    const chunks = chunksRef.current;
    const mime = rec.mimeType || "audio/webm";
    const done = () => {
      const blob = new Blob(chunks, { type: mime });
      teardown();
      if (send) onSend(blob, secs);
      else onCancel();
    };
    if (rec.state === "inactive") {
      done();
      return;
    }
    rec.onstop = done;
    try {
      rec.stop();
    } catch {
      done();
    }
  };

  // Entering voice mode IS the tap — start capturing immediately so one
  // tap = recording. Failures land in the idle view (with its ✕ exit).
  const autoStarted = React.useRef(false);
  React.useEffect(() => {
    if (!autoStarted.current && !disabled) {
      autoStarted.current = true;
      void start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!recording) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Back to text input"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <span className="text-lg leading-none" aria-hidden>✕</span>
        </button>
        <p className="flex-1 text-xs text-slate-500">
          {error ?? "Tap the mic and talk — up to 30 seconds."}
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void start()}
          aria-label="Record voice note"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 text-black shadow-lg shadow-violet-900/30 transition-transform hover:scale-105 disabled:opacity-50"
        >
          <span className="flex items-center gap-1" aria-hidden>
            <span className="h-4 w-1 rounded-full bg-black/70" />
            <span className="h-6 w-1 rounded-full bg-black/70" />
            <span className="h-3 w-1 rounded-full bg-black/70" />
          </span>
        </button>
      </div>
    );
  }

  const progress = Math.min(1, elapsed / MAX_VOICE_SECONDS);
  return (
    <div role="status" aria-label="Recording voice note">
      <div className="flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-2">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute h-full w-full animate-ping rounded-full bg-red-400 opacity-70" />
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        </span>
        <span className="flex h-6 flex-1 items-center gap-[3px]" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-red-300/80 animate-wave-bar"
              style={{ height: 8 + ((i * 7) % 16), animationDelay: `${(i % 8) * 0.1}s` }}
            />
          ))}
        </span>
        <span className="font-mono2 text-xs font-semibold text-red-200">{formatVoiceTime(elapsed)}</span>
        <button
          type="button"
          onClick={() => finish(false)}
          aria-label="Delete recording"
          className="rounded-full p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <Trash2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => finish(true)}
          aria-label="Send voice note"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 text-black shadow-lg transition-transform hover:scale-105"
        >
          <Send size={15} />
        </button>
      </div>
      <div aria-hidden className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-red-400 to-amber-300 transition-[width]"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
