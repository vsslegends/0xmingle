"use client";

import { Button } from "@/components/ui/button";

/** Shell — Phase 4 wires WS send + rate limits. */
export function ChatInput({ disabled = true }: { disabled?: boolean }) {
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Chat input (coming soon)"
    >
      <input
        className="h-11 flex-1 rounded-full border border-white/10 bg-black/30 px-4 text-sm placeholder:text-slate-500"
        placeholder={disabled ? "Chat unlocks with a match (Phase 4)…" : "Say hi…"}
        disabled={disabled}
        aria-label="Message"
      />
      <Button type="submit" disabled={disabled}>Send</Button>
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
