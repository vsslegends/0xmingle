"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Mobile bottom-sheet for chat on small screens. */
export function MobileBottomSheet({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="sm:hidden">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/15 bg-black/70 px-5 py-2 text-sm backdrop-blur"
      >
        {open ? "Hide chat" : "Show chat"}
      </button>
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-20 max-h-[55vh] overflow-auto rounded-t-3xl border-t border-white/10 bg-[#0d1122] p-4 transition-transform",
          open ? "translate-y-0" : "translate-y-full",
        )}
      >
        {children}
      </div>
    </div>
  );
}
