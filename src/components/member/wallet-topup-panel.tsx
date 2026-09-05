"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  prepareMemberWalletTopup,
  refreshMemberWalletTopup,
} from "@/app/(member)/member/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authCopy } from "@/content/site";
import { normalizeQrSrc } from "@/lib/paymongo/qr";
import { formatPeso } from "@/lib/utils";

const PRESETS = [299, 499, 1000, 2000];

export function WalletTopupPanel({
  balanceLabel,
}: {
  balanceLabel: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("1000");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [topupId, setTopupId] = useState<string | null>(null);
  const [qrSrc, setQrSrc] = useState("");
  const [amountLabel, setAmountLabel] = useState("");

  useEffect(() => {
    if (!topupId) return;
    const timer = window.setInterval(() => {
      startTransition(async () => {
        const result = await refreshMemberWalletTopup(topupId);
        if (result.ok && result.redirectTo) {
          setMessage("Top-up confirmed. Updating wallet…");
          router.refresh();
          setTopupId(null);
          setQrSrc("");
        }
      });
    }, 8000);
    return () => window.clearInterval(timer);
  }, [topupId, router]);

  function generate() {
    setError("");
    setMessage("");
    const pesos = Number(amount);
    if (!Number.isFinite(pesos) || pesos < 20) {
      setError("Minimum top-up is ₱20 (PayMongo QR Ph).");
      return;
    }

    startTransition(async () => {
      const result = await prepareMemberWalletTopup(pesos);
      if (!result.ok) {
        setError(result.error);
        setQrSrc("");
        setTopupId(null);
        return;
      }
      setTopupId(result.topupId);
      setQrSrc(normalizeQrSrc(result.qrImageUrl));
      setAmountLabel(result.amountLabel);
    });
  }

  function onRefresh() {
    if (!topupId) return;
    startTransition(async () => {
      const result = await refreshMemberWalletTopup(topupId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.redirectTo) {
        setMessage("Top-up confirmed.");
        router.refresh();
        setTopupId(null);
        setQrSrc("");
        return;
      }
      setMessage(`PayMongo status: ${result.status ?? "pending"}`);
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_rgba(47,56,38,0.04)]">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
        Top up
      </p>
      <h2 className="mt-1 font-display text-xl font-semibold text-ink">
        Add funds to wallet
      </h2>
      <p className="mt-1 text-sm text-muted">
        Current balance: {balanceLabel}. I-scan ang QR Ph after you generate.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className="rounded-lg border border-border bg-cream/70 px-3 py-1.5 text-sm font-medium text-ink hover:border-navy/30"
            onClick={() => setAmount(String(preset))}
          >
            {formatPeso(preset)}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="topup_amount"
            className="mb-1.5 block text-xs font-semibold tracking-wide text-muted uppercase"
          >
            Amount (PHP)
          </label>
          <Input
            id="topup_amount"
            type="number"
            min={20}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="accent"
          disabled={pending}
          onClick={generate}
        >
          {pending && !qrSrc ? "Generating…" : "Generate QR Ph"}
        </Button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 text-sm text-navy" role="status">
          {message}
        </p>
      ) : null}

      {qrSrc ? (
        <div className="mt-5 flex flex-col items-center rounded-xl border border-border bg-cream/70 p-4">
          <p className="text-sm font-medium text-ink">{amountLabel}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt="PayMongo QR Ph wallet top-up"
            className="mt-3 size-[200px] rounded-xl border border-border bg-white object-contain p-2"
          />
          <p className="mt-2 text-center text-xs text-muted">
            {authCopy.checkout.expiry}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-3"
            disabled={pending}
            onClick={onRefresh}
          >
            {pending ? "Checking…" : authCopy.checkout.refresh}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
