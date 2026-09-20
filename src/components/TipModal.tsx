"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export const TIP_PRESETS = ["0.0001", "0.0005", "0.001"] as const;

/** Shell — Phase 7 wires viem transaction with explicit confirmation. */
export function TipModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} label="Send a tip">
      <h2 className="text-lg font-bold">Send a tip</h2>
      <p className="mt-1 text-sm text-slate-400">No transaction happens until you confirm in your wallet.</p>
      <div className="mt-3 flex gap-2">
        {TIP_PRESETS.map((t) => (
          <Button key={t} variant="secondary" size="sm" onClick={onClose}>{t} ETH</Button>
        ))}
      </div>
    </Modal>
  );
}
