"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  prepareCheckoutPayment,
  refreshCheckoutPaymentStatus,
  simulateCheckoutPayment,
  type CheckoutPrepareResult,
} from "@/app/register/actions";
import { Button } from "@/components/ui/button";
import { authCopy } from "@/content/site";
import { normalizeQrSrc } from "@/lib/paymongo/qr";
import {
  clearRegisterDraft,
  readRegisterDraft,
  type RegisterDraft,
} from "@/lib/register/draft";

type ReadyState = Extract<CheckoutPrepareResult, { ok: true }>;

export function CheckoutPaymentPanel() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [missingDraft, setMissingDraft] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState<ReadyState | null>(null);
  const [message, setMessage] = useState("");
  const [qrSrc, setQrSrc] = useState("");
  const draftRef = useRef<RegisterDraft | null>(null);
  const bootstrapped = useRef(false);

  const runPrepare = useCallback(
    (draft: RegisterDraft) => {
      setError("");
      setMessage("");
      startTransition(async () => {
        const result = await prepareCheckoutPayment(draft);
        if (!result.ok) {
          setReady(null);
          setQrSrc("");
          setError(result.error);
          return;
        }
        setReady(result);
        setQrSrc(normalizeQrSrc(result.qrImageUrl));
        if (result.alreadyPaid) {
          clearRegisterDraft();
          setMessage(authCopy.checkout.paid);
          router.replace("/member");
        }
      });
    },
    [router],
  );

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const draft = readRegisterDraft();
    if (!draft) {
      setMissingDraft(true);
      return;
    }

    draftRef.current = draft;
    runPrepare(draft);
  }, [runPrepare]);

  useEffect(() => {
    if (!ready || ready.alreadyPaid || !ready.paymentId) return;

    const timer = window.setInterval(() => {
      startTransition(async () => {
        const result = await refreshCheckoutPaymentStatus(ready.paymentId);
        if (result.ok && result.redirectTo) {
          clearRegisterDraft();
          setMessage(authCopy.checkout.paid);
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
    link.download = `bisayamedva-paymongo-${(ready?.paymentId ?? "qr").slice(0, 8)}.png`;
    link.click();
  }

  function onRetry() {
    const draft = draftRef.current ?? readRegisterDraft();
    if (!draft) {
      setMissingDraft(true);
      return;
    }
    draftRef.current = draft;
    runPrepare(draft);
  }

  function onSimulate() {
    if (!ready?.paymentId) return;
    startTransition(async () => {
      const result = await simulateCheckoutPayment(ready.paymentId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      clearRegisterDraft();
      setMessage(authCopy.checkout.paid);
      router.replace(result.redirectTo ?? "/member");
    });
  }

  function onRefresh() {
    if (!ready?.paymentId) return;
    startTransition(async () => {
      const result = await refreshCheckoutPaymentStatus(ready.paymentId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.redirectTo) {
        clearRegisterDraft();
        setMessage(authCopy.checkout.paid);
        router.replace(result.redirectTo);
        return;
      }
      setMessage(`PayMongo status: ${result.status ?? "pending"}`);
    });
  }

  if (missingDraft) {
    return (
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
          {authCopy.checkout.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-navy">
          {authCopy.checkout.missingTitle}
        </h1>
        <p className="mt-3 leading-relaxed text-muted">
          {authCopy.checkout.missingDraft}
        </p>
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-cream/70 px-4 py-5 text-sm text-muted">
          Tip: Finish the register steps, then click{" "}
          <span className="font-semibold text-navy">Proceed to payment</span> so
          your details are saved for the live QR.
        </div>
        <Button variant="accent" className="mt-6 w-full" asChild>
          <Link href="/register">{authCopy.checkout.back}</Link>
        </Button>
      </div>
    );
  }

  const showPrepareError = Boolean(error) && !qrSrc && !ready?.alreadyPaid;

  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
        {authCopy.checkout.eyebrow}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-navy">
        {authCopy.checkout.title}
      </h1>
      <p className="mt-3 leading-relaxed text-muted">{authCopy.checkout.body}</p>

      <div className="mt-6 rounded-2xl border border-border bg-white p-5">
        <p className="text-sm text-muted">
          {ready?.courseTitle ?? "Medical Billing Training"}
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
          <p className="py-10 text-sm text-navy">{authCopy.checkout.paid}</p>
        ) : showPrepareError ? (
          <div className="w-full py-6 text-center">
            <p className="text-sm font-medium text-destructive" role="alert">
              {error}
            </p>
            <p className="mt-2 text-xs text-muted">
              Check PayMongo keys and that a published course/session exists in
              Admin Content, then retry.
            </p>
            <Button
              type="button"
              variant="accent"
              className="mt-4"
              disabled={pending}
              onClick={onRetry}
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
            onClick={onRetry}
          >
            {authCopy.checkout.retry}
          </Button>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" className="flex-1" asChild>
            <Link href="/register">{authCopy.checkout.back}</Link>
          </Button>
          <Button variant="primary" className="flex-1" asChild>
            <Link href="/">{authCopy.checkout.home}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
