"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  prepareCoursePayment,
  quoteMemberPromo,
} from "@/app/(member)/member/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { memberCheckoutCopy } from "@/content/site";

type ReviewState = {
  courseTitle: string;
  coursePrice: number;
  coursePriceLabel: string;
  sessionLabel: string;
  balance: number;
  balanceLabel: string;
};

type InsufficientState = {
  balanceLabel: string;
  shortfallLabel: string;
  totalLabel: string;
  shortfallAmount: number;
};

function suggestTopupAmount(shortfall: number) {
  return Math.max(20, Math.ceil(shortfall));
}

export function CourseCheckoutPanel({
  slug,
  sessionId,
  courseTitle,
  review,
  reviewError,
  initialPromoCode,
}: {
  slug: string;
  sessionId: string;
  courseTitle: string;
  review?: ReviewState | null;
  reviewError?: string | null;
  initialPromoCode?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [promoPending, startPromoTransition] = useTransition();
  const [error, setError] = useState(reviewError ?? "");
  const [insufficient, setInsufficient] = useState<InsufficientState | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountLabel: string;
    finalLabel: string;
    originalLabel: string;
    finalAmount: number;
  } | null>(null);
  const [promoError, setPromoError] = useState("");
  const initialPromoHandled = useRef(false);

  const totalDue = appliedPromo?.finalAmount ?? review?.coursePrice ?? 0;
  const displayTotal = appliedPromo?.finalLabel ?? review?.coursePriceLabel ?? "—";

  const walletShort = useMemo(() => {
    if (!review) return false;
    return review.balance < totalDue;
  }, [review, totalDue]);

  const shortfallPreview = useMemo(() => {
    if (!review || !walletShort) return 0;
    return Math.max(0, Number((totalDue - review.balance).toFixed(2)));
  }, [review, totalDue, walletShort]);

  const walletTopUpHref = useMemo(() => {
    if (shortfallPreview <= 0) return "/member/wallet";
    return `/member/wallet?suggest=${suggestTopupAmount(shortfallPreview)}`;
  }, [shortfallPreview]);

  useEffect(() => {
    const code = initialPromoCode?.trim();
    if (!code || !review || initialPromoHandled.current) return;
    initialPromoHandled.current = true;
    setPromoInput(code.toUpperCase());
    setPromoError("");
    startPromoTransition(async () => {
      const result = await quoteMemberPromo(slug, code);
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
        finalAmount: result.finalAmount,
      });
    });
  }, [initialPromoCode, review, slug]);

  const runPrepare = useCallback(() => {
    setError("");
    setMessage("");
    setInsufficient(null);
    startTransition(async () => {
      const result = await prepareCoursePayment(
        slug,
        sessionId,
        appliedPromo?.code,
      );
      if (!result.ok) {
        if (result.code === "INSUFFICIENT_WALLET") {
          setInsufficient({
            balanceLabel: result.balanceLabel ?? review?.balanceLabel ?? "—",
            shortfallLabel: result.shortfallLabel ?? "—",
            totalLabel: result.totalLabel ?? displayTotal,
            shortfallAmount: result.shortfallAmount ?? shortfallPreview,
          });
          setError("");
          return;
        }
        setError(result.error);
        return;
      }
      setMessage(
        result.alreadyActive
          ? memberCheckoutCopy.enrolledActive
          : memberCheckoutCopy.enrolledRedirect,
      );
      router.replace("/member/schedule");
    });
  }, [
    appliedPromo?.code,
    displayTotal,
    review?.balanceLabel,
    router,
    sessionId,
    shortfallPreview,
    slug,
  ]);

  const insufficientHref = insufficient
    ? `/member/wallet?suggest=${suggestTopupAmount(insufficient.shortfallAmount)}`
    : walletTopUpHref;

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
        {memberCheckoutCopy.eyebrow}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-navy">
        Pay for {review?.courseTitle ?? courseTitle}
      </h1>
      <p className="mt-3 leading-relaxed text-muted">{memberCheckoutCopy.body}</p>

      <div className="mt-6 rounded-2xl border border-border bg-white p-5">
        <p className="text-sm text-muted">{review?.courseTitle ?? courseTitle}</p>
        <p className="mt-2 text-sm text-navy">
          {review?.sessionLabel ?? "—"}
        </p>
        {review ? (
          <p className="mt-3 text-sm text-muted">
            {memberCheckoutCopy.walletNow}: {review.balanceLabel}
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
                      finalAmount: result.finalAmount,
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

      {walletShort && !insufficient ? (
        <div
          className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-navy"
          role="status"
        >
          <p className="font-semibold">{memberCheckoutCopy.insufficientTitle}</p>
          <p className="mt-1">{memberCheckoutCopy.lowBalanceWarning}</p>
        </div>
      ) : null}

      {insufficient ? (
        <div
          className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-navy"
          role="alert"
        >
          <p className="font-semibold">{memberCheckoutCopy.insufficientTitle}</p>
          <p className="mt-1">
            {memberCheckoutCopy.insufficientBody
              .replace("{total}", insufficient.totalLabel)
              .replace("{balance}", insufficient.balanceLabel)
              .replace("{shortfall}", insufficient.shortfallLabel)}
          </p>
          <p className="mt-2 text-muted">{memberCheckoutCopy.insufficientHint}</p>
        </div>
      ) : null}

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
        {walletShort || insufficient ? (
          <Button variant="accent" className="w-full" asChild>
            <Link href={insufficientHref}>{memberCheckoutCopy.openWallet}</Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="accent"
            className="w-full"
            disabled={pending || !review}
            onClick={runPrepare}
          >
            {pending ? memberCheckoutCopy.proceeding : memberCheckoutCopy.proceed}
          </Button>
        )}
        {!walletShort && !insufficient ? (
          <Button variant="secondary" className="w-full" asChild>
            <Link href="/member/wallet">{memberCheckoutCopy.openWallet}</Link>
          </Button>
        ) : null}
        <Button variant="secondary" className="w-full" asChild>
          <Link href="/member/schedule">{memberCheckoutCopy.backSchedule}</Link>
        </Button>
      </div>
    </div>
  );
}
