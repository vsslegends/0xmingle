"use client";

import { FileText, Download } from "lucide-react";
import { linkify, isImageMime, formatBytes } from "@/lib/attachments";
import type { ChatMessage } from "@/hooks/useMatchmaking";
import { cn } from "@/lib/utils";

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
export function Message({ m }: { m: ChatMessage }) {
  const file = m.file;
  return (
    <div className={m.mine ? "flex justify-end" : "flex justify-start"}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
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
    </div>
  );
}
