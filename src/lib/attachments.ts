/**
 * Client-side attachment helpers. Images are downscaled/compressed before
 * send so WS relay stays light. Bytes are ephemeral — relayed, never stored.
 */

export const MAX_DATAURL_CHARS = 1_500_000; // ~1.1 MB binary
export const MAX_DIM = 1280;
export const JPEG_QUALITY = 0.82;

export const IMAGE_MIMES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;
export const FILE_MIMES = [...IMAGE_MIMES, "application/pdf", "text/plain"] as const;

/** Server enforces the same allowlist — never trust the client. */
export function isAllowedMime(mime: string): boolean {
  return (FILE_MIMES as readonly string[]).includes(mime);
}

export function isImageMime(mime: string): boolean {
  return (IMAGE_MIMES as readonly string[]).includes(mime);
}

export interface PreparedFile {
  name: string;
  mime: string;
  size: number;
  dataUrl: string;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read file."));
    r.readAsDataURL(file);
  });
}

function downscaleImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      // Re-encode photos as JPEG; keep PNG/GIF (transparency/animation).
      const out = /png|gif/i.test(dataUrl.slice(0, 40))
        ? canvas.toDataURL("image/png")
        : canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      resolve(out);
    };
    img.onerror = () => reject(new Error("Could not process image."));
    img.src = dataUrl;
  });
}

/** Validate + prepare a user-picked file for sending. Throws with UI-safe message. */
export async function prepareFile(file: File): Promise<PreparedFile> {
  const mime = file.type || "application/octet-stream";
  if (!isAllowedMime(mime)) {
    throw new Error("That file type isn't supported. Try a photo, PDF, or text file.");
  }
  let dataUrl = await readAsDataUrl(file);
  if (isImageMime(mime) && (file.size > 400_000 || !dataUrl.startsWith("data:image/gif"))) {
    try {
      dataUrl = await downscaleImage(dataUrl);
    } catch {
      /* fall through with original */
    }
  }
  if (dataUrl.length > MAX_DATAURL_CHARS) {
    throw new Error("File is too large after compression (limit ~1 MB).");
  }
  return { name: file.name.slice(0, 120) || "attachment", mime, size: file.size, dataUrl };
}

export type TextPart = { t: "text"; v: string } | { t: "link"; v: string };

/** Split message text into plain/link parts. Only http(s) links. */
export function linkify(text: string): TextPart[] {
  const re = /(https?:\/\/[^\s<>"')]+)/g;
  const parts: TextPart[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = m[1];
    const url = raw.replace(/[.,!?;:]+$/, "");
    const trail = raw.slice(url.length);
    if (m.index > last) parts.push({ t: "text", v: text.slice(last, m.index) });
    parts.push({ t: "link", v: url });
    if (trail) parts.push({ t: "text", v: trail });
    last = m.index + raw.length;
  }
  if (last < text.length) parts.push({ t: "text", v: text.slice(last) });
  // merge adjacent text parts (e.g. punctuation split off a link)
  const merged: TextPart[] = [];
  for (const p of parts) {
    const prev = merged[merged.length - 1];
    if (p.t === "text" && prev?.t === "text") prev.v += p.v;
    else merged.push({ ...p });
  }
  return merged.filter((p) => p.v.length > 0);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
