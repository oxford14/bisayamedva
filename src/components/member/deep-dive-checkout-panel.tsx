"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  prepareDeepDivePayment,
  refreshDeepDivePaymentStatus,
  simulateDeepDivePayment,
  type MemberCheckoutPrepareResult,
} from "@/app/(member)/member/actions";
import { Button } from "@/components/ui/button";
import { authCopy } from "@/content/site";
import { normalizeQrSrc } from "@/lib/paymongo/qr";

type ReadyState = Extract<MemberCheckoutPrepareResult, { ok: true }>;

export function DeepDiveCheckoutPanel() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [ready, setReady] = useState<ReadyState | null>(null);
  const [message, setMessage] = useState("");
  const [qrSrc, setQrSrc] = useState("");
  const bootstrapped = useRef(false);

  const runPrepare = useCallback(() => {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await prepareDeepDivePayment();
      if (!result.ok) {
        setReady(null);
        setQrSrc("");
        setError(result.error);
        return;
      }
      setReady(result);
      setQrSrc(normalizeQrSrc(result.qrImageUrl));
      if (result.alreadyPaid) {
        setMessage("Nabayran na ang Deep Dive. Redirecting to Courses…");
        router.replace("/member/course");
      }
    });
  }, [router]);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    runPrepare();
  }, [runPrepare]);

  useEffect(() => {
    if (!ready || ready.alreadyPaid || !ready.paymentId) return;

    const timer = window.setInterval(() => {
      startTransition(async () => {
        const result = await refreshDeepDivePaymentStatus(ready.paymentId);
        if (result.ok && result.redirectTo) {
          setMessage("Nabayran na ang Deep Dive. Redirecting to Courses…");
          router.replace(result.redirectTo);
        }
      });
    }, 8000);

    return () => window.clearInterval(timer);
  }, [ready, router]);

  function downloadQr() {
    if (!qrSrc) return;
    const link = document.createElement("a");
    link.href = qrSrc;
    link.download = `bisayamedva-deep-dive-${(ready?.paymentId ?? "qr").slice(0, 8)}.png`;
    link.click();
  }

  function onSimulate() {
    if (!ready?.paymentId) return;
    startTransition(async () => {
      const result = await simulateDeepDivePayment(ready.paymentId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Nabayran na ang Deep Dive. Redirecting to Courses…");
      router.replace(result.redirectTo ?? "/member/course");
    });
  }

  function onRefresh() {
    if (!ready?.paymentId) return;
    startTransition(async () => {
      const result = await refreshDeepDivePaymentStatus(ready.paymentId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.redirectTo) {
        setMessage("Nabayran na ang Deep Dive. Redirecting to Courses…");
        router.replace(result.redirectTo);
        return;
      }
      setMessage(`PayMongo status: ${result.status ?? "pending"}`);
    });
  }

  const showPrepareError = Boolean(error) && !qrSrc && !ready?.alreadyPaid;

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
        {authCopy.checkout.eyebrow}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-navy">
        Pay for Full Deep Dive
      </h1>
      <p className="mt-3 leading-relaxed text-muted">
        I-scan ang live QR Ph gamit ang imong bank or e-wallet app — same checkout
        flow as registration. For testing, you can also use Simulate Payment.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-white p-5">
        <p className="text-sm text-muted">
          {ready?.courseTitle ?? "Full MedVA Deep Dive Bundle"}
        </p>
        <p className="mt-1 font-display text-4xl font-semibold text-navy">
          {ready?.amountLabel ?? "—"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {ready?.sessionLabel ?? (pending ? "Loading session…" : "—")}
        </p>
      </div>

      <div className="mt-6 flex flex-col items-center rounded-2xl border border-border bg-cream/70 p-5">
        {pending && !qrSrc && !showPrepareError ? (
          <p className="py-16 text-sm text-muted">{authCopy.checkout.preparing}</p>
        ) : qrSrc ? (
          <>
            {/* PayMongo returns data URL, https URL, or raw base64 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt="PayMongo QR Ph payment code"
              className="size-[220px] rounded-xl border border-border bg-white object-contain p-2"
            />
            <p className="mt-3 text-center text-xs text-muted">
              {authCopy.checkout.expiry}
            </p>
          </>
        ) : ready?.alreadyPaid ? (
          <p className="py-10 text-sm text-navy">
            Nabayran na. Redirecting to Courses…
          </p>
        ) : showPrepareError ? (
          <div className="w-full py-6 text-center">
            <p className="text-sm font-medium text-destructive" role="alert">
              {error}
            </p>
            <p className="mt-2 text-xs text-muted">
              Check PayMongo keys and that the Deep Dive course/session is
              published, then retry.
            </p>
            <Button
              type="button"
              variant="accent"
              className="mt-4"
              disabled={pending}
              onClick={runPrepare}
            >
              {pending ? "Retrying…" : authCopy.checkout.retry}
            </Button>
          </div>
        ) : (
          <p className="py-10 text-sm text-muted">{authCopy.checkout.preparing}</p>
        )}
      </div>

      {error && qrSrc ? (
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
          disabled={pending || !ready?.paymentId || ready.alreadyPaid}
          onClick={onSimulate}
        >
          {pending ? "Working…" : authCopy.checkout.simulate}
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            disabled={pending || !qrSrc}
            onClick={downloadQr}
          >
            {authCopy.checkout.download}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            disabled={pending || !ready?.paymentId}
            onClick={onRefresh}
          >
            {authCopy.checkout.refresh}
          </Button>
        </div>
        {showPrepareError ? null : (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={pending}
            onClick={runPrepare}
          >
            {authCopy.checkout.retry}
          </Button>
        )}
        <Button variant="secondary" className="w-full" asChild>
          <Link href="/member/course">Back to Courses</Link>
        </Button>
      </div>
    </div>
  );
}
