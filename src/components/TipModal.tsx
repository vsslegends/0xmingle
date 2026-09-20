"use client";

import * as React from "react";
import { parseEther, formatEther } from "viem";
import { useSendTransaction, useAccount, useChainId } from "wagmi";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TIP_PRESETS_ETH, buildTipTx } from "@/lib/tips";
import { tipService } from "@/lib/services";

/**
 * Wallet-to-wallet tip. Server quotes the platform fee (authoritative);
 * the wallet sends the full amount and the recipient/fee split settles
 * via the payment service / contract later. Never auto-sends.
 */
export function TipModal({
  open,
  onClose,
  recipient,
}: {
  open: boolean;
  onClose: () => void;
  recipient?: string;
}) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { sendTransaction, isPending, error } = useSendTransaction();
  const [amount, setAmount] = React.useState<string>(TIP_PRESETS_ETH[0]);
  const [quote, setQuote] = React.useState<{ feeWei: string; recipientWei: string; feeBps: number } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setQuote(null);
    let cancelled = false;
    void (async () => {
      try {
        const wei = parseEther(amount as `${number}`).toString();
        const q = await tipService.quote(wei);
        if (!cancelled) setQuote(q);
      } catch {
        if (!cancelled) setQuote(null);
      }
    })();
    return () => { cancelled = true; };
  }, [open, amount]);

  const valid = React.useMemo(() => {
    try {
      return parseEther(amount as `${number}`) > 0n;
    } catch {
      return false;
    }
  }, [amount]);

  const confirm = () => {
    if (!recipient || !valid) return;
    const tx = buildTipTx(recipient, parseEther(amount as `${number}`));
    if (!tx) return;
    sendTransaction({ to: tx.to, value: tx.value });
  };

  return (
    <Modal open={open} onClose={onClose} label="Send a tip">
      <h2 className="text-lg font-bold">Send a tip</h2>
      <p className="mt-1 text-sm text-slate-400">
        {recipient ? <>To <span className="text-white">{recipient.slice(0, 6)}…{recipient.slice(-4)}</span> · </> : null}
        No transaction happens until you confirm in your wallet.
      </p>
      <div className="mt-3 flex gap-2">
        {TIP_PRESETS_ETH.map((t) => (
          <Button key={t} variant={amount === t ? "primary" : "secondary"} size="sm" onClick={() => setAmount(t)}>
            {t} ETH
          </Button>
        ))}
      </div>
      <label className="mt-3 block text-sm">Custom amount (ETH)
        <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.001" />
      </label>
      {quote && valid && (
        <dl className="mt-3 space-y-1 rounded-xl border border-white/10 p-3 text-xs text-slate-400">
          <div className="flex justify-between"><dt>Recipient gets</dt><dd className="text-white">{formatEther(BigInt(quote.recipientWei))} ETH</dd></div>
          <div className="flex justify-between"><dt>Platform fee ({(quote.feeBps / 100).toFixed(1)}%)</dt><dd>{formatEther(BigInt(quote.feeWei))} ETH</dd></div>
          <div className="flex justify-between"><dt>Network</dt><dd>chain {chainId}</dd></div>
        </dl>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-red-300">{error.message}</p>}
      {!isConnected && <p className="mt-2 text-xs text-amber-200">Connect your wallet to tip.</p>}
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button disabled={!valid || !isConnected || !recipient || isPending} onClick={confirm}>
          {isPending ? "Confirm in wallet…" : "Confirm tip"}
        </Button>
      </div>
    </Modal>
  );
}
