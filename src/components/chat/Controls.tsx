"use client";

import { Button } from "@/components/ui/button";

/** Shells — Phase 5 wires WebRTC. NEXT stays primary and reachable. */
export function NextButton({ onNext }: { onNext?: () => void }) {
  return (
    <Button data-testid="next-button" size="lg" onClick={onNext} className="min-w-40">
      Next →
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
