import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Minimal .env loader for standalone processes. Next.js reads .env.local
 * automatically, but `tsx`/node do not — without this the realtime gateway
 * runs with no SESSION_SECRET and rejects every connection as unauthorized.
 * Real environment variables always win over file values.
 */
export function loadEnvFiles(dir: string = process.cwd()): void {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(dir, file);
    if (!existsSync(path)) continue;
    let text: string;
    try {
      text = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!key || process.env[key] !== undefined) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        value.length >= 2 &&
        ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'")))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}
