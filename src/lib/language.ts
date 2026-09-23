"use client";

import * as React from "react";

/** Chat-language preference. Node-safe (memory fallback, no localStorage). */
export const LANGS = [
  { code: "off", label: "Off" },
  { code: "nl", label: "Nederlands" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "hi", label: "हिन्दी" },
  { code: "ar", label: "العربية" },
  { code: "tr", label: "Türkçe" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
] as const;

const KEY = "oxmingle-lang";
const listeners = new Set<() => void>();
let memory: string | null = null;

function supported(code: string): boolean {
  return LANGS.some((l) => l.code === code);
}

function defaultLang(): string {
  try {
    const nav =
      typeof navigator !== "undefined"
        ? navigator.language?.slice(0, 2).toLowerCase()
        : "";
    // Non-English browsers get their language; English is the lingua
    // franca here, so "off" avoids pointless same-language API calls.
    if (nav && nav !== "en" && supported(nav)) return nav;
  } catch {
    /* ignore */
  }
  return "off";
}

export function getChatLanguage(): string {
  try {
    if (typeof localStorage !== "undefined") {
      const v = localStorage.getItem(KEY);
      if (v && supported(v)) return v;
    }
  } catch {
    /* private mode etc. */
  }
  return memory ?? defaultLang();
}

export function setChatLanguage(code: string): void {
  const next = supported(code) ? code : "off";
  memory = next;
  try {
    localStorage?.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn());
}

export function useChatLanguage(): string {
  return React.useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    getChatLanguage,
    () => "off",
  );
}
