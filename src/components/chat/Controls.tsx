"use client";

import { Button } from "@/components/ui/button";

/** Shells — Phase 5 wires WebRTC. NEXT stays primary and reachable. */
export function NextButton({ onNext }: { onNext?: () => void }) {
  return (
    <Button data-testid="next-button" size="lg" onClick={onNext} className="min-w-40 flex-1 shadow-xl shadow-violet-950/50 sm:flex-none">
      Next
      <kbd className="rounded-md bg-black/25 px-1.5 py-0.5 font-mono2 text-[10px] font-bold" aria-hidden>↵</kbd>
    </Button>
  );
}

export function BlockButton({ onBlock }: { onBlock?: () => void }) {
  return (
    <Button variant="danger" size="sm" onClick={onBlock}>
      Block
    </Button>
  );
}
