import { MAX_DATAURL_CHARS, type PreparedFile } from "@/lib/attachments";

/**
 * GIF search via Giphy (optional). Needs NEXT_PUBLIC_GIPHY_API_KEY —
 * free beta key from https://developers.giphy.com/dashboard
 * (100 calls/hour, plenty for a chat picker). Without it the GIF tab
 * stays hidden and nothing here runs.
 * GIFs arrive as small fixed-width files so they survive the relay
 * untouched (animated GIFs are never re-encoded, preserving animation).
 */

export function gifKey(): string | null {
  const k = process.env.NEXT_PUBLIC_GIPHY_API_KEY?.trim();
  return k ? k : null;
}

export interface GifResult {
  id: string;
  previewUrl: string;
  fullUrl: string;
  width: number;
  height: number;
}

interface GiphyImages {
  fixed_width_small?: { url?: string; width?: string; height?: string };
}

interface GiphyResponse {
  data?: Array<{ id?: string; images?: GiphyImages }>;
}

function parseResults(json: GiphyResponse): GifResult[] {
  const out: GifResult[] = [];
  for (const item of json.data ?? []) {
    const img = item.images?.fixed_width_small;
    if (!item.id || !img?.url) continue;
    out.push({
      id: String(item.id),
      previewUrl: img.url,
      fullUrl: img.url,
      width: Number(img.width ?? 200),
      height: Number(img.height ?? 200),
    });
  }
  return out;
}

async function query(kind: "gifs" | "stickers", path: "search" | "trending", q?: string): Promise<GifResult[]> {
  const key = gifKey();
  if (!key) throw new Error("GIF search isn't configured yet.");
  const params = new URLSearchParams({
    api_key: key,
    limit: "24",
    rating: "g",
  });
  if (kind === "gifs") params.set("bundle", "messaging_non_clips");
  if (q) params.set("q", q);
  const res = await fetch(`https://api.giphy.com/v1/${kind}/${path}?${params}`);
  if (res.status === 401 || res.status === 403) {
    throw new Error("GIF key rejected — check NEXT_PUBLIC_GIPHY_API_KEY.");
  }
  if (!res.ok) throw new Error("GIF search failed. Try again.");
  const json = (await res.json()) as GiphyResponse;
  return parseResults(json);
}

export function trendingGifs(): Promise<GifResult[]> {
  return query("gifs", "trending");
}

export function searchGifs(q: string): Promise<GifResult[]> {
  return query("gifs", "search", q);
}

export function trendingStickers(): Promise<GifResult[]> {
  return query("stickers", "trending");
}

export function searchStickers(q: string): Promise<GifResult[]> {
  return query("stickers", "search", q);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read GIF."));
    r.readAsDataURL(blob);
  });
}

/** Fetch a GIF's bytes and pack them as a sendable attachment. */
export async function fetchGifAttachment(gif: GifResult): Promise<PreparedFile> {
  const res = await fetch(gif.fullUrl);
  if (!res.ok) throw new Error("Could not download that GIF.");
  const blob = await res.blob();
  if (blob.type && !blob.type.startsWith("image/")) {
    throw new Error("That GIF isn't an image.");
  }
  const dataUrl = await blobToDataUrl(blob);
  if (dataUrl.length > MAX_DATAURL_CHARS) {
    throw new Error("That GIF is too large to send.");
  }
  return { name: "gif.gif", mime: "image/gif", size: blob.size, dataUrl };
}
