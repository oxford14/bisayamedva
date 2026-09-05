"use client";

import { useEffect, useId } from "react";
import { PaymentHoldCountdown } from "@/components/payments/payment-hold-countdown";
import { Button } from "@/components/ui/button";
import { authCopy } from "@/content/site";

export function MemberCheckoutQrSheet({
  open,
  onClose,
  courseTitle,
  sessionLabel,
  amountLabel,
  qrSrc,
  pending,
  error,
  message,
  onRefresh,
  onRetry,
  onDownload,
  expiresAt,
  holdExpired,
  onHoldExpired,
}: {
  open: boolean;
  onClose: () => void;
  courseTitle: string;
  sessionLabel: string;
  amountLabel: string;
  qrSrc: string;
  pending: boolean;
  error: string;
  message: string;
  onRefresh: () => void;
  onRetry: () => void;
  onDownload: () => void;
  expiresAt?: string;
  holdExpired?: boolean;
  onHoldExpired?: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
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
          {authCopy.checkout.title}
        </h2>
        <p className="mt-2 text-sm text-muted">
          I-scan ang QR Ph. After pay, automatic mi mo-enroll sa imong selected
          schedule.
        </p>
        <div className="mt-4 rounded-2xl border border-border bg-cream/70 p-4">
          <p className="text-sm text-muted">{courseTitle}</p>
          <p className="mt-1 font-display text-3xl font-semibold text-navy">
            {amountLabel}
          </p>
          <p className="mt-1 text-sm text-muted">{sessionLabel}</p>
        </div>

        <div className="mt-4 flex flex-col items-center rounded-2xl border border-border bg-cream/70 p-5">
          {pending && !qrSrc ? (
            <p className="py-12 text-sm text-muted">{authCopy.checkout.preparing}</p>
          ) : holdExpired ? (
            <div className="w-full py-6 text-center">
              <p className="text-sm font-medium text-destructive" role="status">
                {authCopy.checkout.expired}
              </p>
            </div>
          ) : qrSrc ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt="PayMongo QR Ph wallet top-up"
                className="size-[220px] rounded-xl border border-border bg-white object-contain p-2"
              />
              {expiresAt ? (
                <PaymentHoldCountdown
                  expiresAt={expiresAt}
                  onExpired={onHoldExpired}
                />
              ) : (
                <p className="mt-3 text-center text-xs text-muted">
                  {authCopy.checkout.expiry}
                </p>
              )}
            </>
          ) : error ? (
            <p className="py-6 text-center text-sm font-medium text-destructive" role="alert">
              {error}
            </p>
          ) : (
            <p className="py-12 text-sm text-muted">{authCopy.checkout.preparing}</p>
          )}
        </div>

        {error && qrSrc ? (
          <p
            className="mt-3 rounded-xl bg-sand px-3.5 py-2.5 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {message ? (
          <p
            className="mt-3 rounded-xl bg-teal-bright/20 px-3.5 py-2.5 text-sm text-navy"
            role="status"
          >
            {message}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="accent"
              className="flex-1"
              disabled={pending || holdExpired || !qrSrc}
              onClick={onRefresh}
            >
              {pending ? "Checking…" : authCopy.checkout.refresh}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={pending || holdExpired || !qrSrc}
              onClick={onDownload}
            >
              {authCopy.checkout.download}
            </Button>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={onRetry}
          >
            {pending ? "Retrying…" : authCopy.checkout.retry}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
