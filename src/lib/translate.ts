/**
 * Keyless live translation via Google's gtx endpoint (auto-detect source).
 * Ephemeral by design: results are cached in-memory only (current session),
 * texts are never stored. Requires network to translate.googleapis.com —
 * failures degrade to showing the original text.
 */

interface Cached {
  text: string;
  source: string;
}

const cache = new Map<string, Cached>();
const MAX_CACHE = 500;

export function translateCacheSize(): number {
  return cache.size;
}

/** Test hook — clears the in-memory cache. */
export function __resetTranslateCache(): void {
  cache.clear();
}

export async function translateText(
  text: string,
  target: string,
): Promise<{ text: string; source: string }> {
  const clean = text.slice(0, 500);
  const key = `${target}::${clean}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(clean)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`translate failed (${res.status})`);
  const json = (await res.json()) as unknown[];
  const segments = json[0] as Array<[string]> | null;
  const source = String(json[2] ?? "auto");
  const out = (segments ?? []).map((s) => s[0]).join("");
  if (!out) throw new Error("empty translation");
  const result = { text: out, source };
  cache.set(key, result);
  if (cache.size > MAX_CACHE) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  return result;
}

/** True when the detected source already matches the target language. */
export function isSameLanguage(source: string, target: string): boolean {
  return source.toLowerCase().split("-")[0] === target.toLowerCase().split("-")[0];
}
