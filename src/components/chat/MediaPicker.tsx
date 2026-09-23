"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchGifs, searchStickers, gifKey, trendingGifs, trendingStickers, type GifResult } from "@/lib/gif";

interface EmojiEntry {
  e: string;
  k: string;
}

const EMOJI: EmojiEntry[] = [
  { e: "😂", k: "laugh joy funny lol" }, { e: "❤️", k: "love heart red" },
  { e: "🔥", k: "fire lit hot" }, { e: "👍", k: "thumbs up like yes" },
  { e: "😮", k: "wow surprised shocked" }, { e: "😢", k: "cry sad tears" },
  { e: "😡", k: "angry mad rage" }, { e: "👏", k: "clap applause bravo" },
  { e: "🥺", k: "pleading cute puppy" }, { e: "😎", k: "cool sunglasses" },
  { e: "🤔", k: "thinking hmm" }, { e: "🙌", k: "hooray celebrate praise" },
  { e: "💀", k: "skull dead lol" }, { e: "✨", k: "sparkles magic new" },
  { e: "🎉", k: "party tada celebrate" }, { e: "😴", k: "sleep tired bored" },
  { e: "🤝", k: "handshake deal agree" }, { e: "👀", k: "eyes looking watch" },
  { e: "💯", k: "hundred perfect score" }, { e: "🚀", k: "rocket launch moon" },
  { e: "🌙", k: "moon night late" }, { e: "☕", k: "coffee tea morning" },
  { e: "🍕", k: "pizza food" }, { e: "🎮", k: "gaming controller videogame" },
  { e: "🎧", k: "music headphones listening" }, { e: "⚽", k: "football soccer sports" },
  { e: "✈️", k: "travel plane flight trip" }, { e: "🌊", k: "wave ocean sea" },
  { e: "🌹", k: "rose flower love" }, { e: "💎", k: "diamond gem rich" },
  { e: "👋", k: "wave hello hi bye" }, { e: "🤷", k: "shrug whatever idk" },
  { e: "😇", k: "angel innocent blessed" }, { e: "🤡", k: "clown funny joke" },
  { e: "👻", k: "ghost spooky anonymous" }, { e: "🤖", k: "robot bot ai" },
  { e: "💜", k: "purple heart love" }, { e: "💔", k: "broken heart breakup" },
  { e: "🙏", k: "pray please thanks" }, { e: "💪", k: "strong muscle flex" },
  { e: "🎨", k: "art paint creative" }, { e: "📚", k: "books reading study" },
  { e: "💤", k: "sleep snore" }, { e: "🌈", k: "rainbow pride" },
  { e: "⚡", k: "lightning fast zap" }, { e: "🎯", k: "target bullseye exact" },
  { e: "🍀", k: "lucky clover" }, { e: "🥳", k: "party celebrate birthday" },
];

const STICKERS = ["❤️", "😂", "🔥", "👍", "😮", "👏", "🥺", "🚀", "👻", "🤝", "🎉", "💀", "✨", "🙌", "😎", "💯"];

type Tab = "emoji" | "stickers" | "gif";

/**
 * Emoji insert + sticker send + GIF search in one popover.
 * GIF tab appears only when a Tenor key is configured.
 */
export function MediaPicker({
  gifEnabled,
  gifBusy,
  onInsertEmoji,
  onSendSticker,
  onPickGif,
  onPickSticker,
  onClose,
}: {
  gifEnabled: boolean;
  gifBusy: boolean;
  onInsertEmoji: (e: string) => void;
  onSendSticker: (e: string) => void;
  onPickGif: (g: GifResult) => void;
  onPickSticker: (g: GifResult) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = React.useState<Tab>("emoji");
  const [q, setQ] = React.useState("");
  const [gifs, setGifs] = React.useState<GifResult[]>([]);
  const [gifLoading, setGifLoading] = React.useState(false);
  const [gifError, setGifError] = React.useState<string | null>(null);
  const [stickers, setStickers] = React.useState<GifResult[]>([]);
  const [stickerLoading, setStickerLoading] = React.useState(false);
  const [stickerError, setStickerError] = React.useState<string | null>(null);
  const searchTimer = React.useRef<number | null>(null);
  const stickerTimer = React.useRef<number | null>(null);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return EMOJI;
    return EMOJI.filter((x) => x.k.includes(needle));
  }, [q]);

  const loadGifs = React.useCallback(async (term: string) => {
    setGifLoading(true);
    setGifError(null);
    try {
      setGifs(term ? await searchGifs(term) : await trendingGifs());
    } catch (e) {
      setGifError(e instanceof Error ? e.message : "GIF search failed.");
      setGifs([]);
    } finally {
      setGifLoading(false);
    }
  }, []);

  // Load trending when the GIF tab opens; debounce search typing.
  React.useEffect(() => {
    if (tab !== "gif" || !gifKey()) return;
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => void loadGifs(q.trim()), q.trim() ? 400 : 0);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [tab, q, loadGifs]);

  const loadStickers = React.useCallback(async (term: string) => {
    setStickerLoading(true);
    setStickerError(null);
    try {
      setStickers(term ? await searchStickers(term) : await trendingStickers());
    } catch (e) {
      setStickerError(e instanceof Error ? e.message : "Sticker search failed.");
      setStickers([]);
    } finally {
      setStickerLoading(false);
    }
  }, []);

  // Real sticker art (Giphy) when configured; debounced search like GIFs.
  React.useEffect(() => {
    if (tab !== "stickers" || !gifKey()) return;
    if (stickerTimer.current) window.clearTimeout(stickerTimer.current);
    stickerTimer.current = window.setTimeout(() => void loadStickers(q.trim()), q.trim() ? 400 : 0);
    return () => {
      if (stickerTimer.current) window.clearTimeout(stickerTimer.current);
    };
  }, [tab, q, loadStickers]);

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "emoji", label: "😀 Emoji" },
    { id: "stickers", label: "★ Stickers" },
  ];
  if (gifEnabled) tabs.push({ id: "gif", label: "GIF" });

  return (
    <div
      role="dialog"
      aria-label="Emoji, stickers and GIFs"
      className="w-full overflow-hidden rounded-2xl border border-white/15 bg-[#141524] shadow-2xl shadow-black/60"
    >
      <div className="flex gap-1 border-b border-white/10 p-1.5" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              tab === t.id ? "bg-violet-500/25 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white",
            )}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={onClose}
          aria-label="Close picker"
          className="rounded-full px-2 text-slate-500 hover:text-white"
        >
          ✕
        </button>
      </div>

      {tab === "emoji" ? (
        <div className="p-1.5">
          <label className="flex items-center gap-2 rounded-full bg-black/30 px-3 py-1">
            <Search size={13} className="shrink-0 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search emoji…"
              aria-label="Search emoji"
              className="w-full bg-transparent text-[13px] text-white placeholder:text-slate-500 focus:outline-none"
            />
          </label>
          <div className="mt-1.5 grid max-h-32 grid-cols-10 gap-px overflow-y-auto" role="listbox" aria-label="Emoji">
            {filtered.map((x) => (
              <button
                key={x.e}
                role="option"
                aria-selected={false}
                aria-label={`Insert ${x.e}`}
                onClick={() => onInsertEmoji(x.e)}
                className="rounded-md p-0.5 text-[17px] leading-6 transition-transform hover:scale-125 hover:bg-white/10"
              >
                {x.e}
              </button>
            ))}
            {filtered.length === 0 ? (
              <p className="col-span-10 py-4 text-center text-sm text-slate-500">No matches — try “love” or “fire”.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "stickers" ? (
        gifEnabled ? (
          <div className="p-2">
            <label className="flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5">
              <Search size={14} className="shrink-0 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search stickers…"
                aria-label="Search stickers"
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
            </label>
            {stickerLoading ? (
              <p className="py-8 text-center text-sm text-slate-500" role="status">Unpacking stickers…</p>
            ) : stickerError ? (
              <p className="py-8 text-center text-sm text-amber-200" role="alert">{stickerError}</p>
            ) : (
              <div className="mt-2 grid max-h-44 grid-cols-4 gap-1 overflow-y-auto">
                {stickers.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => onPickSticker(g)}
                    disabled={gifBusy}
                    aria-label="Send this sticker"
                    className="rounded-xl p-1 transition-transform hover:scale-105 hover:bg-white/10 disabled:opacity-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.previewUrl} alt="" loading="lazy" className="h-16 w-full object-contain" />
                  </button>
                ))}
                {stickers.length === 0 ? (
                  <p className="col-span-4 py-6 text-center text-sm text-slate-500">No stickers found.</p>
                ) : null}
              </div>
            )}
            <p className="px-1 pb-1 pt-2 text-[11px] text-slate-500">Tap to send instantly. Powered by GIPHY.</p>
          </div>
        ) : (
          <div className="p-2">
            <div className="grid max-h-44 grid-cols-4 gap-1 overflow-y-auto">
              {STICKERS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSendSticker(s)}
                  aria-label={`Send ${s} sticker`}
                  className="rounded-xl p-2 text-4xl transition-transform hover:scale-110 hover:bg-white/10"
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="px-1 pb-1 pt-2 text-[11px] text-slate-500">Tap to send instantly — big, no text needed.</p>
          </div>
        )
      ) : null}

      {tab === "gif" ? (
        <div className="p-2">
          <label className="flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5">
            <Search size={14} className="shrink-0 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search GIFs…"
              aria-label="Search GIFs"
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
          </label>
          {gifLoading ? (
            <p className="py-8 text-center text-sm text-slate-500" role="status">Summoning GIFs…</p>
          ) : gifError ? (
            <p className="py-8 text-center text-sm text-amber-200" role="alert">{gifError}</p>
          ) : (
            <div className="mt-2 grid max-h-44 grid-cols-3 gap-1 overflow-y-auto">
              {gifs.map((g) => (
                <button
                  key={g.id}
                  onClick={() => onPickGif(g)}
                  disabled={gifBusy}
                  aria-label="Send this GIF"
                  className="overflow-hidden rounded-lg transition-transform hover:scale-[1.03] disabled:opacity-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.previewUrl} alt="" loading="lazy" className="h-20 w-full object-cover" />
                </button>
              ))}
              {gifs.length === 0 ? (
                <p className="col-span-3 py-6 text-center text-sm text-slate-500">No GIFs found.</p>
              ) : null}
            </div>
          )}
          <p className="px-1 pb-1 pt-2 text-[11px] text-slate-500">Powered by GIPHY. Previews attach — press Send.</p>
        </div>
      ) : null}
    </div>
  );
}
