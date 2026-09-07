"use client";

import { QRCodeCanvas } from "qrcode.react";
import { certificatesCopy } from "@/content/site";
import { getCertificateVerifyUrl } from "@/lib/payments/pay-url";

export function CertificateVerifyQr({
  certificateId,
  compact = false,
}: {
  certificateId: string;
  compact?: boolean;
}) {
  const url = getCertificateVerifyUrl(certificateId);
  const size = compact ? 72 : 128;

  return (
    <div className="flex max-w-sm flex-col items-center gap-1.5 text-center">
      <div className="rounded-lg border border-navy/10 bg-white p-1.5">
        <QRCodeCanvas
          value={url}
          size={size}
          level="M"
          bgColor="#FFFFFF"
          fgColor="#3F4A32"
          includeMargin
        />
      </div>
      <p className="text-[11px] font-medium text-ink">{certificatesCopy.scanPrompt}</p>
      <p className="text-[10px] leading-relaxed text-muted">{certificatesCopy.scanNote}</p>
    </div>
  );
}
