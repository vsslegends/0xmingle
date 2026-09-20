"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

/** Phase 2 wires real wallet options; shell keeps API stable. */
export function ConnectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} label="Connect wallet">
      <h2 className="text-lg font-bold">Connect wallet</h2>
      <p className="mt-1 text-sm text-slate-400">
        MetaMask, Coinbase Wallet, WalletConnect, and Robinhood Wallet via standard EVM connectors (Phase 2).
      </p>
      <Button className="mt-4 w-full" onClick={onClose}>Continue</Button>
    </Modal>
  );
}
