"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  prepareCoursePayment,
  quoteMemberPromo,
  refreshMemberWalletTopup,
  type MemberCheckoutPrepareResult,
} from "@/app/(member)/member/actions";
import { MemberCheckoutQrSheet } from "@/components/member/member-checkout-qr-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPeso } from "@/lib/utils";
import { normalizeQrSrc } from "@/lib/paymongo/qr";

type ReadyState = Extract<MemberCheckoutPrepareResult, { ok: true }>;
type ReviewState = {
  courseTitle: string;
  coursePrice: number;
  coursePriceLabel: string;
  sessionLabel: string;
  balanceLabel: string;
};

export function CourseCheckoutPanel({
  slug,
  sessionId,
  courseTitle,
  review,
  reviewError,
}: {
  slug: string;
  sessionId: string;
  courseTitle: string;
  review?: ReviewState | null;
  reviewError?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [promoPending, startPromoTransition] = useTransition();
  const [error, setError] = useState(reviewError ?? "");
  const [ready, setReady] = useState<ReadyState | null>(null);
  const [message, setMessage] = useState("");
  const [qrSrc, setQrSrc] = useState("");
  const [holdExpired, setHoldExpired] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountLabel: string;
    finalLabel: string;
    originalLabel: string;
  } | null>(null);
  const [promoError, setPromoError] = useState("");

  const displayTotal = appliedPromo?.finalLabel ?? review?.coursePriceLabel ?? "—";

  const runPrepare = useCallback(() => {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await prepareCoursePayment(
        slug,
        sessionId,
        appliedPromo?.code,
      );
      if (!result.ok) {
        setReady(null);
        setQrSrc("");
        setHoldExpired(false);
        setSheetOpen(false);
        setError(result.error);
        return;
      }
      setReady(result);
      setHoldExpired(false);
      if (result.mode === "enrolled") {
        setSheetOpen(false);
        setMessage(
          result.alreadyActive
            ? "Active na imong seat. Redirecting…"
            : "Nabayran via wallet. Redirecting…",
        );
        router.replace("/member/schedule");
        return;
      }
      setQrSrc(normalizeQrSrc(result.qrImageUrl));
      setSheetOpen(true);
    });
  }, [appliedPromo?.code, router, sessionId, slug]);

  useEffect(() => {
    if (!ready || ready.mode !== "topup" || !ready.topupId || !sheetOpen || holdExpired) {
      return;
    }

    const timer = window.setInterval(() => {
      startTransition(async () => {
        const result = await refreshMemberWalletTopup(ready.topupId);
        if (result.ok && result.redirectTo) {
          setMessage("Top-up confirmed. Checking enrollment…");
          router.replace("/member/schedule");
          return;
        }
        if (result.ok && result.status === "EXPIRED") {
          setHoldExpired(true);
        }
      });
    }, 8000);

    return () => window.clearInterval(timer);
  }, [holdExpired, ready, router, sheetOpen]);

  function downloadQr() {
    if (!qrSrc) return;
    const link = document.createElement("a");
    link.href = qrSrc;
    link.download = `bisayamedva-wallet-${(ready && ready.mode === "topup" ? ready.topupId : "qr").slice(0, 8)}.png`;
    link.click();
  }

  function onRefresh() {
    if (!ready || ready.mode !== "topup") return;
    startTransition(async () => {
      const result = await refreshMemberWalletTopup(ready.topupId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.redirectTo) {
        setMessage("Top-up confirmed. Redirecting to Schedule…");
        router.replace("/member/schedule");
        return;
      }
      if (result.status === "EXPIRED") {
        setHoldExpired(true);
        return;
      }
      setMessage(`PayMongo status: ${result.status ?? "pending"}`);
    });
  }

  if (ready?.mode === "enrolled") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-white p-6 text-center">
        <p className="font-semibold text-ink">Seat reserved</p>
        <p className="mt-2 text-sm text-muted">
          {ready.alreadyActive
            ? "Active na imong enrollment for this course."
            : "Nabayran via wallet. Opening your schedule…"}
        </p>
        <Button variant="accent" className="mt-5" asChild>
          <Link href="/member/schedule">Open schedule</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
        Review enrollment
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-navy">
        Pay for {review?.courseTitle ?? courseTitle}
      </h1>
      <p className="mt-3 leading-relaxed text-muted">
        Check your schedule and add a promo if you have one. Proceed to pay via
        wallet — we generate PayMongo QR if kulang ang balance.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-white p-5">
        <p className="text-sm text-muted">{review?.courseTitle ?? courseTitle}</p>
        <p className="mt-2 text-sm text-navy">
          {review?.sessionLabel ?? "—"}
        </p>
        {review ? (
          <p className="mt-3 text-sm text-muted">
            Wallet now: {review.balanceLabel}
          </p>
        ) : null}

        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Promo code
          </p>
          <div className="mt-2 flex gap-2">
            <Input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="flex-1"
              disabled={Boolean(appliedPromo) || !review}
            />
            {appliedPromo ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setAppliedPromo(null);
                  setPromoInput("");
                  setPromoError("");
                }}
              >
                Remove
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                disabled={promoPending || !promoInput.trim() || !review}
                onClick={() => {
                  setPromoError("");
                  startPromoTransition(async () => {
                    const result = await quoteMemberPromo(slug, promoInput);
                    if (!result.ok) {
                      setAppliedPromo(null);
                      setPromoError(result.error);
                      return;
                    }
                    setAppliedPromo({
                      code: result.code,
                      discountLabel: result.discountLabel,
                      finalLabel: result.finalLabel,
                      originalLabel: result.originalLabel,
                    });
                  });
                }}
              >
                {promoPending ? "…" : "Apply"}
              </Button>
            )}
          </div>
          {promoError ? (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {promoError}
            </p>
          ) : null}
          {appliedPromo ? (
            <p className="mt-2 text-sm text-navy">
              Applied <span className="font-semibold">{appliedPromo.code}</span>{" "}
              (−{appliedPromo.discountLabel})
            </p>
          ) : null}
        </div>

        <dl className="mt-4 space-y-3 text-sm">
          {appliedPromo ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Subtotal</dt>
              <dd className="text-right text-muted line-through">
                {appliedPromo.originalLabel}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-t border-border pt-3">
            <dt className="font-semibold text-navy">Total</dt>
            <dd className="font-display text-2xl text-navy">{displayTotal}</dd>
          </div>
        </dl>
      </div>

      {error ? (
        <p
          className="mt-4 rounded-xl bg-sand px-3.5 py-2.5 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          className="mt-4 rounded-xl bg-teal-bright/20 px-3.5 py-2.5 text-sm text-navy"
          role="status"
        >
          {message}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <Button
          type="button"
          variant="accent"
          className="w-full"
          disabled={pending || !review}
          onClick={runPrepare}
        >
          {pending ? "Preparing…" : "Proceed"}
        </Button>
        <Button variant="secondary" className="w-full" asChild>
          <Link href="/member/wallet">Open Wallet</Link>
        </Button>
        <Button variant="secondary" className="w-full" asChild>
          <Link href="/member/schedule">Back to Schedule</Link>
        </Button>
      </div>

      <MemberCheckoutQrSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        courseTitle={ready?.courseTitle ?? review?.courseTitle ?? courseTitle}
        sessionLabel={ready?.sessionLabel ?? review?.sessionLabel ?? ""}
        amountLabel={
          ready && ready.mode === "topup"
            ? ready.amountLabel
            : appliedPromo?.finalLabel ??
              review?.coursePriceLabel ??
              formatPeso(0)
        }
        qrSrc={qrSrc}
        pending={pending}
        error={error}
        message={message}
        onRefresh={onRefresh}
        onRetry={runPrepare}
        onDownload={downloadQr}
        expiresAt={ready && ready.mode === "topup" ? ready.expiresAt : undefined}
        holdExpired={holdExpired}
        onHoldExpired={() => setHoldExpired(true)}
      />
    </div>
  );
}
