"use client";

import * as React from "react";
import { isSameLanguage, translateText } from "@/lib/translate";
import { useChatLanguage } from "@/lib/language";
import { RichText } from "@/components/chat/RichText";

/**
 * Auto-translating message text. When the user picked a chat language,
 * incoming text renders translated with a one-tap "show original" toggle.
 * Translation runs through Google's endpoint (see lib/translate) —
 * failures and same-language results silently show the original.
 */
export function TranslatableText({ text, enabled = true }: { text: string; enabled?: boolean }) {
  const lang = useChatLanguage();
  const [translated, setTranslated] = React.useState<{ text: string; source: string } | null>(null);
  const [showOriginal, setShowOriginal] = React.useState(false);

  React.useEffect(() => {
    setTranslated(null);
    setShowOriginal(false);
  }, [text, lang]);

  React.useEffect(() => {
    if (!enabled || lang === "off" || !text.trim()) return;
    let live = true;
    translateText(text, lang)
      .then((r) => {
        if (!live) return;
        // Same language or echo: nothing to translate.
        if (r.text === text || isSameLanguage(r.source, lang)) return;
        setTranslated(r);
      })
      .catch(() => {
        /* offline/blocked — original stays */
      });
    return () => {
      live = false;
    };
  }, [text, lang, enabled]);

  if (!enabled || !translated) {
    return <RichText text={text} dark={false} />;
  }
  const src = translated.source.toUpperCase().slice(0, 5);
  return (
    <div>
      {showOriginal ? <RichText text={text} dark={false} /> : <p>{translated.text}</p>}
      <button
        type="button"
        onClick={() => setShowOriginal((v) => !v)}
        className="mt-0.5 text-[11px] opacity-70 underline decoration-dotted hover:opacity-100"
        aria-label={showOriginal ? "Show translation." : `Translated from ${src}. Show original.`}
      >
        {showOriginal ? `🌐 show ${lang.toUpperCase()}` : `🌐 ${src}→${lang.toUpperCase()} · original`}
      </button>
    </div>
  );
}
