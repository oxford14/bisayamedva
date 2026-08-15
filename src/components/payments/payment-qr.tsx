"use client";

import { Download, QrCode, X } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getPaymentPayUrl } from "@/lib/payments/pay-url";
import { cn } from "@/lib/utils";

type PaymentQrProps = {
  paymentId: string;
  amountLabel: string;
  courseTitle?: string;
  className?: string;
  /** Compact admin trigger that opens a modal */
  variant?: "card" | "button";
};

export function PaymentQr({
  paymentId,
  amountLabel,
  courseTitle,
  className,
  variant = "card",
}: PaymentQrProps) {
  const titleId = useId();
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [payUrl, setPayUrl] = useState(() => getPaymentPayUrl(paymentId));
  const [open, setOpen] = useState(variant === "card");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPayUrl(`${window.location.origin}/pay/${paymentId}`);
  }, [paymentId]);

  useEffect(() => {
    if (variant === "card" || !open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, variant]);

  function downloadPng() {
    const canvas = canvasWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `bisayamedva-payment-${paymentId.slice(0, 8)}.png`;
    link.click();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(payUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const panel = (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-[16px] border border-border bg-white p-5 text-center",
        className,
      )}
      role="region"
      aria-labelledby={titleId}
    >
      <div className="space-y-1">
        <p id={titleId} className="text-sm font-semibold text-ink">
          Payment QR
        </p>
        <p className="text-xs text-muted">
          I-scan para ma-open ang payment page · {amountLabel}
          {courseTitle ? ` · ${courseTitle}` : ""}
        </p>
      </div>

      <div
        ref={canvasWrapRef}
        className="rounded-[12px] border border-border bg-cream p-3"
      >
        {payUrl ? (
          <QRCodeCanvas
            value={payUrl}
            size={200}
            level="M"
            bgColor="#F7F4EC"
            fgColor="#3F4A32"
            includeMargin
          />
        ) : (
          <div className="flex h-[200px] w-[200px] items-center justify-center text-xs text-muted">
            Loading QR…
          </div>
        )}
      </div>

      <p className="max-w-[16rem] break-all text-[11px] leading-relaxed text-muted">
        {payUrl}
      </p>

      <div className="flex w-full flex-wrap justify-center gap-2">
        <Button type="button" variant="accent" size="sm" onClick={downloadPng}>
          <Download className="size-4" aria-hidden />
          Download QR
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={copyLink}>
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
    </div>
  );

  if (variant === "card") return panel;

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <QrCode className="size-4" aria-hidden />
        QR
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute -top-2 -right-2 z-10 flex size-9 items-center justify-center rounded-full border border-border bg-white text-navy shadow-sm hover:bg-cream"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </button>
            {panel}
          </div>
        </div>
      ) : null}
    </>
  );
}
