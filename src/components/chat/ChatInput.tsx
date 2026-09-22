"use client";

import * as React from "react";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prepareFile, type PreparedFile } from "@/lib/attachments";

/** Live input: text + image/file attachments (ephemeral relay) + typing notices. */
export function ChatInput({
  disabled = false,
  onSend,
  onFile,
  onTyping,
  replyTo,
  editing,
  onCancelMeta,
  onEditCommit,
}: {
  disabled?: boolean;
  onSend: (text: string) => void;
  onFile?: (file: PreparedFile) => void;
  onTyping?: (on: boolean) => void;
  replyTo?: { from: string; text: string } | null;
  editing?: { text: string } | null;
  onCancelMeta?: () => void;
  onEditCommit?: (text: string) => void;
}) {
  const [value, setValue] = React.useState("");
  const [pending, setPending] = React.useState<PreparedFile | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [attachError, setAttachError] = React.useState<string | null>(null);
  const pickerRef = React.useRef<HTMLInputElement>(null);
  const stopTimer = React.useRef<number | null>(null);

  // When edit mode starts, preload the message text.
  React.useEffect(() => {
    if (editing) setValue(editing.text);
  }, [editing]);

  const type = (v: string) => {
    setValue(v);
    onTyping?.(true);
    if (stopTimer.current) window.clearTimeout(stopTimer.current);
    stopTimer.current = window.setTimeout(() => onTyping?.(false), 1500);
  };

  const pick = async (file: File | undefined) => {
    if (!file || !onFile) return;
    setBusy(true);
    setAttachError(null);
    try {
      setPending(await prepareFile(file));
    } catch (e) {
      setAttachError(e instanceof Error ? e.message : "Could not attach file.");
    } finally {
      setBusy(false);
    }
  };

  const send = () => {
    if (editing && onEditCommit) {
      if (!value.trim()) return;
      onEditCommit(value);
      setValue("");
      onTyping?.(false);
      return;
    }
    if (pending && onFile) {
      onFile(pending);
      setPending(null);
      onTyping?.(false);
      return;
    }
    if (!value.trim()) return;
    onSend(value);
    setValue("");
    onTyping?.(false);
  };

  return (
    <div>
      {editing ? (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 p-2 text-xs" role="status">
          <span className="flex-1 truncate text-amber-100">Editing message — press Save.</span>
          <button
            type="button"
            onClick={() => { setValue(""); onCancelMeta?.(); }}
            aria-label="Cancel editing"
            className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      ) : replyTo ? (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-2 text-xs" role="status">
          <span className="flex-1 truncate text-slate-300">
            Replying to <span className="font-semibold">{replyTo.from}</span>: {replyTo.text.slice(0, 80) || "attachment"}
          </span>
          <button
            type="button"
            onClick={() => onCancelMeta?.()}
            aria-label="Cancel reply"
            className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}
      {pending ? (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-2 text-xs" role="status">
          {pending.dataUrl.startsWith("data:image") ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={pending.dataUrl} alt={pending.name} className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <span className="max-w-40 truncate px-1">{pending.name}</span>
          )}
          <span className="flex-1 text-slate-400">Ready to send — press Send.</span>
          <button
            type="button"
            onClick={() => setPending(null)}
            aria-label="Remove attachment"
            className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}
      <form
        className="flex gap-2"
        aria-label="Chat input"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        {onFile ? (
          <>
            <input
              ref={pickerRef}
              type="file"
              className="hidden"
              accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain"
              aria-label="Attach a photo or file"
              onChange={(e) => {
                void pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={disabled || busy}
              onClick={() => pickerRef.current?.click()}
              aria-label="Attach a photo or file"
            >
              <Paperclip size={16} />
            </Button>
          </>
        ) : null}
        <input
          value={value}
          onChange={(e) => type(e.target.value.slice(0, 500))}
          onPaste={(e) => {
            const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.kind === "file");
            const file = item?.getAsFile();
            if (file && onFile) {
              e.preventDefault();
              void pick(file);
            }
          }}
          className="h-11 flex-1 rounded-full border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
          placeholder={disabled ? "Connecting…" : pending ? "Add a note? (sends separately)" : "Say hi…"}
          disabled={disabled || busy}
          aria-label="Message"
          maxLength={500}
        />
        <Button type="submit" disabled={disabled || busy || (!value.trim() && !pending)}>
          {busy ? "…" : editing ? "Save" : "Send"}
        </Button>
      </form>
      {attachError ? (
        <p role="alert" className="mt-1 text-xs text-amber-200">{attachError}</p>
      ) : null}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <p className="text-xs text-slate-500" role="status" aria-label="Stranger is typing">
      <span className="animate-pulse">Stranger is typing…</span>
    </p>
  );
}
