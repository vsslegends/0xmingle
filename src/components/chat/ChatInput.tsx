"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

/** Live input: sends via WS, notifies typing with debounce. */
export function ChatInput({
  disabled = false,
  onSend,
  onTyping,
}: {
  disabled?: boolean;
  onSend: (text: string) => void;
  onTyping?: (on: boolean) => void;
}) {
  const [value, setValue] = React.useState("");
  const stopTimer = React.useRef<number | null>(null);

  const type = (v: string) => {
    setValue(v);
    onTyping?.(true);
    if (stopTimer.current) window.clearTimeout(stopTimer.current);
    stopTimer.current = window.setTimeout(() => onTyping?.(false), 1500);
  };

  return (
    <form
      className="flex gap-2"
      aria-label="Chat input"
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSend(value);
        setValue("");
        onTyping?.(false);
      }}
    >
      <input
        value={value}
        onChange={(e) => type(e.target.value.slice(0, 500))}
        className="h-11 flex-1 rounded-full border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
        placeholder={disabled ? "Connecting…" : "Say hi…"}
        disabled={disabled}
        aria-label="Message"
        maxLength={500}
      />
      <Button type="submit" disabled={disabled || !value.trim()}>Send</Button>
    </form>
  );
}

export function TypingIndicator() {
  return (
    <p className="text-xs text-slate-500" role="status" aria-label="Stranger is typing">
      <span className="animate-pulse">Stranger is typing…</span>
    </p>
  );
}
