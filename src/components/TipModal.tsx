"use client";

import * as React from "react";
import { formatEther } from "viem";
import { useSendTransaction, useAccount, useChainId } from "wagmi";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TIP_PRESETS_ETH, TIP_PRESETS_USD, parseTipAmount, usdToWei, buildTipTx } from "@/lib/tips";
import { fetchEthUsd } from "@/lib/eth-price";
import { tipService } from "@/lib/services";

type Currency = "USD" | "ETH";

/**
 * Wallet-to-wallet tip in ETH or USD. USD converts at the live ETH price;
 * server quotes the platform fee (authoritative). The wallet sends the full
 * amount and the recipient/fee split settles via the payment service /
 * contract later. Never auto-sends.
 */
export function TipModal({
  open,
  onClose,
  recipient,
  onSent,
  mode = "send",
  onRequest,
  initialAmount,
  initialCurrency,
}: {
  open: boolean;
  onClose: () => void;
  recipient?: string;
  /** Called once per confirmed tx with a display string like "$1.00" or "0.001 ETH". */
  onSent?: (display: string) => void;
  /** "send": wallet transfer now. "request": ask an anonymous peer to accept first. */
  mode?: "send" | "request";
  /** Called in request mode with the wei amount + display string. */
  onRequest?: (amountWei: string, display: string) => void;
  initialAmount?: string;
  initialCurrency?: Currency;
}) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { sendTransaction, data: txHash, isPending, error, reset } = useSendTransaction();
  const [currency, setCurrency] = React.useState<Currency>("USD");
  const [amount, setAmount] = React.useState<string>(TIP_PRESETS_USD[0]);
  const [price, setPrice] = React.useState<number | null | undefined>(undefined);
  const [quote, setQuote] = React.useState<{ feeWei: string; recipientWei: string; feeBps: number } | null>(null);
  const sentFor = React.useRef<string | null>(null);

  const presets = currency === "USD" ? TIP_PRESETS_USD : TIP_PRESETS_ETH;

  React.useEffect(() => {
    if (!open) return;
    if (initialCurrency) setCurrency(initialCurrency);
    if (initialAmount) setAmount(initialAmount);
    setQuote(null);
    sentFor.current = null;
    reset();
    setPrice(undefined);
    let cancelled = false;
    void fetchEthUsd().then((p) => { if (!cancelled) setPrice(p); });
    return () => { cancelled = true; };
  }, [open, reset, initialAmount, initialCurrency]);

  const pickCurrency = (c: Currency) => {
    setCurrency(c);
    setAmount(c === "USD" ? TIP_PRESETS_USD[0] : TIP_PRESETS_ETH[0]);
  };

  const amountWei = React.useMemo(() => {
    if (currency === "ETH") return parseTipAmount(amount);
    if (price == null) return null;
    return usdToWei(amount, price);
  }, [currency, amount, price]);

  const valid = amountWei != null && amountWei > 0n;

  React.useEffect(() => {
    if (!open || !valid || !amountWei) return;
    setQuote(null);
    let cancelled = false;
    void (async () => {
      try {
        const q = await tipService.quote(amountWei.toString());
        if (!cancelled) setQuote(q);
      } catch {
        if (!cancelled) setQuote(null);
      }
    })();
    return () => { cancelled = true; };
  }, [open, valid, amountWei]);

  const display = currency === "USD" ? `$${amount}` : `${amount} ETH`;

  const confirm = () => {
    if (!amountWei) return;
    if (mode === "request") {
      onRequest?.(amountWei.toString(), display);
      onClose();
      return;
    }
    if (!recipient) return;
    const tx = buildTipTx(recipient, amountWei);
    if (!tx) return;
    sendTransaction({ to: tx.to, value: tx.value });
  };

  // Announce once per confirmed tx, then close. Rejection keeps the modal open.
  React.useEffect(() => {
    if (open && txHash && sentFor.current !== txHash) {
      sentFor.current = txHash;
      onSent?.(display);
      onClose();
    }
  }, [open, txHash, display, onSent, onClose]);

  const priceMissing = currency === "USD" && price === null;
  const hint =
    currency === "USD"
      ? price === undefined
        ? "Fetching live ETH price…"
        : price === null
          ? "Price unavailable right now — switch to ETH."
          : `1 ETH ≈ $${price.toLocaleString("en-US", { maximumFractionDigits: 2 })} · min $0.10`
      : "Any amount. No transaction happens until you confirm in your wallet.";

  return (
    <Modal open={open} onClose={onClose} label={mode === "request" ? "Request a tip" : "Send a tip"}>
      <h2 className="text-lg font-bold">{mode === "request" ? "Ask for a tip" : "Send a tip"}</h2>
      <p className="mt-1 text-sm text-slate-400">
        {mode === "request" ? (
          <>The stranger can accept (revealing their address for this one tip) or decline — nothing is shared unless they accept.</>
        ) : (
          <>{recipient ? <>To <span className="text-white">{recipient.slice(0, 6)}…{recipient.slice(-4)}</span> · </> : null}
          No transaction happens until you confirm in your wallet.</>
        )}
      </p>
      <div className="mt-3 flex gap-2" role="group" aria-label="Currency">
        {(["USD", "ETH"] as const).map((c) => (
          <Button key={c} variant={currency === c ? "primary" : "secondary"} size="sm" onClick={() => pickCurrency(c)}>
            {c === "USD" ? "$ USD" : "Ξ ETH"}
          </Button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((t) => (
          <Button key={t} variant={amount === t ? "primary" : "secondary"} size="sm" onClick={() => setAmount(t)}>
            {currency === "USD" ? `$${t}` : `${t} ETH`}
          </Button>
        ))}
      </div>
      <label className="mt-3 block text-sm">Custom amount ({currency === "USD" ? "$" : "ETH"})
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder={currency === "USD" ? "5.00" : "0.001"}
        />
      </label>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
      {quote && valid && amountWei && (
        <dl className="mt-3 space-y-1 rounded-xl border border-white/10 p-3 text-xs text-slate-400">
          <div className="flex justify-between">
            <dt>Recipient gets</dt>
            <dd className="text-white">
              {formatEther(BigInt(quote.recipientWei))} ETH
              {currency === "USD" && price ? ` (≈ $${((Number(quote.recipientWei) / 1e18) * price).toFixed(2)})` : null}
            </dd>
          </div>
          <div className="flex justify-between"><dt>Platform fee ({(quote.feeBps / 100).toFixed(1)}%)</dt><dd>{formatEther(BigInt(quote.feeWei))} ETH</dd></div>
          <div className="flex justify-between"><dt>Network</dt><dd>chain {chainId}</dd></div>
        </dl>
      )}
      {error && mode === "send" && <p role="alert" className="mt-2 text-xs text-red-300">{error.message}</p>}
      {!isConnected && <p className="mt-2 text-xs text-amber-200">Connect your wallet to tip.</p>}
      {mode === "send" && !recipient && <p className="mt-2 text-xs text-amber-200">This stranger is anonymous — tips need a wallet-mode peer.</p>}
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button disabled={!valid || !isConnected || (mode === "send" && (!recipient || isPending)) || priceMissing} onClick={confirm}>
          {mode === "request" ? `Ask for ${display}` : isPending ? "Confirm in wallet…" : `Confirm ${display} tip`}
        </Button>
      </div>
    </Modal>
  );
}
