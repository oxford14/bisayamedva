"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  prepareMemberWalletTopup,
  refreshMemberWalletTopup,
} from "@/app/(member)/member/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authCopy, walletCopy } from "@/content/site";
import { normalizeQrSrc } from "@/lib/paymongo/qr";
import { formatPeso } from "@/lib/utils";

const PRESETS = [499, 1000, 2000];

export function WalletTopupPanel({
  balanceLabel,
}: {
  balanceLabel: string;
}) {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("1000");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [topupId, setTopupId] = useState<string | null>(null);
  const [qrSrc, setQrSrc] = useState("");
  const [amountLabel, setAmountLabel] = useState("");

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!topupId || !open) return;
    const timer = window.setInterval(() => {
      startTransition(async () => {
        const result = await refreshMemberWalletTopup(topupId);
        if (result.ok && result.redirectTo) {
          setMessage(walletCopy.confirmed);
          router.refresh();
          setTopupId(null);
          setQrSrc("");
          setOpen(false);
        }
      });
    }, 8000);
    return () => window.clearInterval(timer);
  }, [topupId, open, router]);

  function close() {
    setOpen(false);
  }

  function generate() {
    setError("");
    setMessage("");
    const pesos = Number(amount);
    if (!Number.isFinite(pesos) || pesos < 20) {
      setError(walletCopy.minAmount);
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
        setMessage(walletCopy.confirmedShort);
        router.refresh();
        setTopupId(null);
        setQrSrc("");
        setOpen(false);
        return;
      }
      setMessage(`PayMongo status: ${result.status ?? "pending"}`);
    });
  }

  function downloadQr() {
    if (!qrSrc) return;
    const link = document.createElement("a");
    link.href = qrSrc;
    link.download = `bisayamedva-wallet-${(topupId ?? "qr").slice(0, 8)}.png`;
    link.click();
  }

  return (
    <>
      <Button type="button" variant="accent" onClick={() => setOpen(true)}>
        {walletCopy.button}
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-2xl border border-border bg-white p-5 shadow-[0_24px_60px_rgba(47,56,38,0.18)] sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden" />
            <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
              {authCopy.checkout.eyebrow}
            </p>
            <h2
              id={titleId}
              className="mt-1 font-display text-2xl font-semibold text-ink"
            >
              {walletCopy.title}
            </h2>
            <p className="mt-2 text-sm text-muted">{walletCopy.body}</p>
            <p className="mt-1 text-sm text-muted">
              Current balance: {balanceLabel}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    amount === String(preset)
                      ? "border-teal bg-teal-bright/15 text-navy"
                      : "border-border bg-cream/70 text-ink hover:border-navy/30"
                  }`}
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
                  {walletCopy.amountLabel}
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
                {pending && !qrSrc ? walletCopy.generating : walletCopy.generate}
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

            {pending && !qrSrc ? (
              <p className="mt-5 py-8 text-center text-sm text-muted">
                {authCopy.checkout.preparing}
              </p>
            ) : qrSrc ? (
              <div className="mt-5 flex flex-col items-center rounded-2xl border border-border bg-cream/70 p-5">
                <p className="font-display text-4xl font-semibold text-navy sm:text-5xl">
                  {amountLabel}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrSrc}
                  alt="PayMongo QR Ph wallet top-up"
                  className="mt-4 size-[280px] rounded-2xl border border-border bg-white object-contain p-4 sm:size-[320px]"
                />
                <p className="mt-3 text-center text-xs text-muted">
                  {authCopy.checkout.expiry}
                </p>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3">
              {qrSrc ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="accent"
                    className="flex-1"
                    disabled={pending}
                    onClick={onRefresh}
                  >
                    {pending ? "Checking…" : authCopy.checkout.refresh}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    disabled={pending}
                    onClick={downloadQr}
                  >
                    {authCopy.checkout.download}
                  </Button>
                </div>
              ) : null}
              <Button type="button" variant="secondary" onClick={close}>
                {walletCopy.close}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
