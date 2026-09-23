"use client";

import * as React from "react";
import { Camera, FolderOpen, Image as ImageIcon, Mic, Smile, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prepareAudio, prepareFile, type PreparedFile } from "@/lib/attachments";
import { fetchGifAttachment, gifKey, type GifResult } from "@/lib/gif";
import { MediaPicker } from "@/components/chat/MediaPicker";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";

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
  onCommand,
}: {
  disabled?: boolean;
  onSend: (text: string) => void;
  onFile?: (file: PreparedFile) => void;
  onTyping?: (on: boolean) => void;
  replyTo?: { from: string; text: string } | null;
  editing?: { text: string } | null;
  onCancelMeta?: () => void;
  onEditCommit?: (text: string) => void;
  /** Slash-command interceptor (e.g. "/next"). Return true when handled. */
  onCommand?: (raw: string) => boolean;
}) {
  const [value, setValue] = React.useState("");
  const [pending, setPending] = React.useState<PreparedFile | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [attachError, setAttachError] = React.useState<string | null>(null);
  const [sendingNote, setSendingNote] = React.useState<string | null>(null);
  const [flash, setFlash] = React.useState(false);
  const [attachOpen, setAttachOpen] = React.useState(false);
  const [mediaOpen, setMediaOpen] = React.useState(false);
  const [voicing, setVoicing] = React.useState(false);
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const photosRef = React.useRef<HTMLInputElement>(null);
  const filesRef = React.useRef<HTMLInputElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const stopTimer = React.useRef<number | null>(null);
  const flashTimer = React.useRef<number | null>(null);
  const hadMeta = React.useRef(false);

  // When edit mode starts, preload the message text.
  React.useEffect(() => {
    if (editing) setValue(editing.text);
  }, [editing]);

  // Reply/edit tapped → jump straight into the textbox: focus it (cursor
  // blinking, keyboard up where the platform allows) plus a brief ring flash.
  React.useEffect(() => {
    const active = Boolean(replyTo || editing);
    if (active && !hadMeta.current) {
      inputRef.current?.focus({ preventScroll: true });
      setFlash(true);
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash(false), 900);
    }
    hadMeta.current = active;
    return () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, [replyTo, editing]);

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

  /** Tap an emoji → it joins the text and sends straight away. */
  const insertEmoji = (e: string) => {
    if (disabled || busy) return;
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = (value.slice(0, start) + e + value.slice(end)).slice(0, 500);
    setValue(next);
    if (editing || pending) {
      // Mid-edit or attachment armed: just stage it, keep the sheet open.
      type(next);
      requestAnimationFrame(() => el?.focus({ preventScroll: true }));
      return;
    }
    setMediaOpen(false);
    commit(next);
  };

  /** Stickers send instantly as their own message. */
  const sendSticker = (e: string) => {
    if (disabled || busy) return;
    if (editing) onCancelMeta?.();
    setMediaOpen(false);
    onSend(e);
  };

  /** A picked GIF downloads and sends straight away — one tap. */
  const pickGif = (g: GifResult) => {
    if (!onFile || disabled || busy) return;
    setMediaOpen(false);
    sendAttachment(g, "Fetching GIF…");
  };

  /** A picked sticker downloads and sends straight away — one tap. */
  const pickSticker = (g: GifResult) => {
    if (!onFile || disabled || busy) return;
    setMediaOpen(false);
    sendAttachment(g, "Sending sticker…");
  };

  const sendAttachment = (g: GifResult, note: string) => {
    setBusy(true);
    setAttachError(null);
    setSendingNote(note);
    void fetchGifAttachment(g)
      .then((f) => {
        if (onFile) onFile(f);
      })
      .catch((e) => {
        setAttachError(e instanceof Error ? e.message : "Could not send that.");
      })
      .finally(() => {
        setBusy(false);
        setSendingNote(null);
      });
  };

  /** A finished voice note packs and sends straight away — one tap. */
  const sendVoice = (blob: Blob, durationSec: number) => {
    if (!onFile) {
      setVoicing(false);
      return;
    }
    setBusy(true);
    setAttachError(null);
    setSendingNote("Sending voice note…");
    void prepareAudio(blob, durationSec)
      .then((f) => {
        if (onFile) onFile(f);
        setVoicing(false);
      })
      .catch((e) => {
        setAttachError(e instanceof Error ? e.message : "Could not send that.");
      })
      .finally(() => {
        setBusy(false);
        setSendingNote(null);
      });
  };

  const commit = (raw: string) => {
    if (editing && onEditCommit) {
      if (!raw.trim()) return;
      onEditCommit(raw);
      setValue("");
      onTyping?.(false);
      return;
    }
    const clean = raw.trim();
    if (clean.startsWith("/") && onCommand?.(clean)) {
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
    if (!clean) return;
    onSend(raw);
    setValue("");
    onTyping?.(false);
  };

  const send = () => commit(value);

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
      {voicing ? (
        <VoiceRecorder
          disabled={disabled || busy}
          onSend={sendVoice}
          onCancel={() => setVoicing(false)}
        />
      ) : (
      <form
        className="flex gap-2"
        aria-label="Chat input"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        {onFile ? (
          <div className="relative">
            {attachOpen ? (
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                onClick={() => setAttachOpen(false)}
                className="fixed inset-0 z-20 cursor-default bg-transparent"
              />
            ) : null}
            <input
              ref={cameraRef}
              type="file"
              className="hidden"
              accept="image/*"
              capture="environment"
              aria-label="Take a photo"
              onChange={(e) => {
                void pick(e.target.files?.[0]);
                e.target.value = "";
                setAttachOpen(false);
              }}
            />
            <input
              ref={photosRef}
              type="file"
              className="hidden"
              accept="image/*"
              aria-label="Choose from photo library"
              onChange={(e) => {
                void pick(e.target.files?.[0]);
                e.target.value = "";
                setAttachOpen(false);
              }}
            />
            <input
              ref={filesRef}
              type="file"
              className="hidden"
              accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain"
              aria-label="Choose a file"
              onChange={(e) => {
                void pick(e.target.files?.[0]);
                e.target.value = "";
                setAttachOpen(false);
              }}
            />
            {attachOpen ? (
              <div role="menu" aria-label="Attach" className="absolute bottom-full left-0 z-30 mb-2 w-48 overflow-hidden rounded-2xl border border-white/15 bg-[#141524]/98 shadow-2xl shadow-black/60 backdrop-blur-md">
                {[
                  { label: "Take photo", icon: Camera, hint: "Camera", run: () => cameraRef.current?.click() },
                  { label: "Photo library", icon: ImageIcon, hint: "Images + GIFs", run: () => photosRef.current?.click() },
                  { label: "Files", icon: FolderOpen, hint: "PDF · text", run: () => filesRef.current?.click() },
                ].map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    role="menuitem"
                    onClick={o.run}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-white/10"
                  >
                    <o.icon size={17} className="shrink-0 text-cyan-300" />
                    <span className="flex-1">{o.label}</span>
                    <span className="text-[11px] text-slate-500">{o.hint}</span>
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="secondary"
                disabled={disabled || busy}
                onClick={() => { setMediaOpen(false); setAttachOpen((v) => !v); }}
                aria-label="Attach a photo or file"
                aria-expanded={attachOpen}
                className="!px-3"
              >
                <Camera size={16} />
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={disabled || busy}
                onClick={() => { setAttachOpen(false); setMediaOpen((v) => !v); }}
                aria-label="Emoji, stickers and GIFs"
                aria-expanded={mediaOpen}
                className="!px-3"
              >
                <Smile size={16} />
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={disabled || busy}
                onClick={() => { setAttachOpen(false); setMediaOpen(false); setVoicing((v) => !v); }}
                aria-label="Record voice note"
                aria-expanded={voicing}
                className="!px-3"
              >
                <Mic size={16} />
              </Button>
            </div>
          </div>
        ) : null}
        <input
          ref={inputRef}
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
          className={`h-11 flex-1 rounded-full border bg-black/30 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60 transition-shadow ${flash ? "border-cyan-300/70 shadow-[0_0_0_3px_rgb(103_232_249/0.35)]" : "border-white/10"}`}
          placeholder={disabled ? "Connecting…" : pending ? "Add a note? (sends separately)" : "Say hi…"}
          disabled={disabled || busy}
          aria-label="Message"
          maxLength={500}
        />
        <Button type="submit" disabled={disabled || busy || (!value.trim() && !pending)}>
          {busy ? "…" : editing ? "Save" : "Send"}
        </Button>
      </form>
      )}
      {mediaOpen && !voicing ? (
        <div className="mt-2">
              <MediaPicker
                gifEnabled={gifKey() !== null}
                gifBusy={busy}
                onInsertEmoji={insertEmoji}
                onSendSticker={sendSticker}
                onPickGif={pickGif}
                onPickSticker={pickSticker}
                onClose={() => setMediaOpen(false)}
              />
        </div>
      ) : null}
      {sendingNote ? (
        <p role="status" className="mt-1 animate-pulse text-xs text-cyan-300">{sendingNote}</p>
      ) : null}
      {attachError ? (
        <p role="alert" className="mt-1 text-xs text-amber-200">{attachError}</p>
      ) : null}
      <p className="mt-1.5 font-mono2 text-[10px] tracking-wide text-slate-600" aria-hidden>
        /next · /tip 0.01 · /report spam · /help
      </p>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <p className="flex items-center gap-2 text-xs text-slate-500" role="status" aria-label="Stranger is typing">
      <span className="flex h-4 items-center gap-[3px]" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-cyan-300 animate-wave-bar"
            style={{ height: 14, animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </span>
      encoding reply…
    </p>
  );
}
