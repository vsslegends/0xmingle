"use client";

import * as React from "react";
import { FileText, Download, SmilePlus } from "lucide-react";
import { linkify, isImageMime, formatBytes } from "@/lib/attachments";
import type { ChatMessage } from "@/hooks/useMatchmaking";
import { cn } from "@/lib/utils";

export const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍", "👏", "🔥"] as const;

function time(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function RichText({ text, dark }: { text: string; dark: boolean }) {
  return (
    <p>
      {linkify(text).map((part, i) =>
        part.t === "link" ? (
          <a
            key={i}
            href={part.v}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={dark ? "underline decoration-black/40 break-all" : "text-cyan-300 underline break-all"}
          >
            {part.v}
          </a>
        ) : (
          <span key={i}>{part.v}</span>
        ),
      )}
    </p>
  );
}

/** One chat bubble: linkified text plus inline image / file download. Ephemeral. */
export function Message({
  m,
  reactions,
  onReact,
}: {
  m: ChatMessage;
  reactions?: Record<string, { count: number; mine: boolean }>;
  onReact?: (emoji: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const file = m.file;
  const chips = Object.entries(reactions ?? {}).filter(([, r]) => r.count > 0);
  return (
    <div className={m.mine ? "flex justify-end" : "flex justify-start"}>
      <div className="group relative max-w-[80%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-2 text-sm",
            m.mine
              ? "rounded-tr-md bg-gradient-to-r from-violet-500 to-cyan-400 text-black"
              : "rounded-tl-md bg-white/10 text-slate-200",
          )}
        >
          {file && isImageMime(file.mime) ? (
            <a href={file.dataUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${file.name} full size`}>
              {/* data: URL from allowlisted image mime — next/image can't optimize these */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={file.dataUrl} alt={file.name} className="max-h-56 rounded-lg object-cover" loading="lazy" />
            </a>
          ) : null}
          {file && !isImageMime(file.mime) ? (
            <a
              href={file.dataUrl}
              download={file.name}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5",
                m.mine ? "bg-black/15" : "bg-black/30",
              )}
            >
              <FileText size={18} className="shrink-0" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{file.name}</span>
                <span className={m.mine ? "text-[11px] text-black/60" : "text-[11px] text-slate-400"}>
                  {formatBytes(file.size)} · tap to save
                </span>
              </span>
              <Download size={16} className="shrink-0" />
            </a>
          ) : null}
          {m.text ? <RichText text={m.text} dark={m.mine} /> : null}
          <p className={m.mine ? "mt-0.5 text-[10px] text-black/60" : "mt-0.5 text-[10px] text-slate-500"}>
            {m.mine ? "You" : m.from} · {time(m.at)}
          </p>
        </div>
        {onReact ? (
          <button
            type="button"
            aria-label="React with emoji"
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen((v) => !v)}
            className={cn(
              "absolute -bottom-2 rounded-full border border-white/10 bg-[#141524] p-1 text-slate-400 shadow-lg transition-opacity hover:text-white",
              m.mine ? "-left-3" : "-right-3",
              pickerOpen ? "opacity-100" : "opacity-0 focus-visible:opacity-100 group-hover:opacity-100",
            )}
          >
            <SmilePlus size={14} />
          </button>
        ) : null}
        {pickerOpen && onReact ? (
          <div className="absolute -bottom-9 z-10 flex gap-1 rounded-full border border-white/10 bg-[#141524] p-1.5 shadow-xl" role="toolbar" aria-label="Choose a reaction">
            {REACTION_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                aria-label={`React ${e}`}
                onClick={() => { onReact(e); setPickerOpen(false); }}
                className="rounded-full px-1.5 py-0.5 text-lg transition-transform hover:scale-125"
              >
                {e}
              </button>
            ))}
          </div>
        ) : null}
        {chips.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {chips.map(([e, r]) => (
              <button
                key={e}
                type="button"
                aria-label={`${e} × ${r.count}${r.mine ? ", yours" : ""}. Tap to ${r.mine ? "remove" : "add"} your reaction."`}
                onClick={() => onReact?.(e)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs",
                  r.mine ? "border-violet-400 bg-violet-500/25" : "border-white/10 bg-black/30 text-slate-300",
                )}
              >
                {e} {r.count > 1 ? r.count : ""}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
