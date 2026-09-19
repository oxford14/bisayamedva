"use client";

import { QRCodeCanvas } from "qrcode.react";
import { certificatesCopy } from "@/content/site";
import { getCertificateVerifyUrl } from "@/lib/payments/pay-url";

export function CertificateVerifyQr({
  certificateId,
  compact = false,
  size: sizeProp,
}: {
  certificateId: string;
  compact?: boolean;
  size?: number;
}) {
  const url = getCertificateVerifyUrl(certificateId);
  const size = sizeProp ?? (compact ? 96 : 128);

  if (compact) {
    return (
      <div className="inline-flex flex-col items-center text-center leading-none">
        <QRCodeCanvas
          value={url}
          size={size}
          level="M"
          bgColor="#FFFFFF"
          fgColor="#2D4A22"
          includeMargin={false}
        />
        <p className="-mt-px text-[9px] font-medium leading-none text-[#5A664F]">
          {certificatesCopy.scanPromptShort}
        </p>
      </div>
    );
  }

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
        <p className="mt-1 text-[10px] font-medium text-[#5A664F]">
          {certificatesCopy.scanPromptShort}
        </p>
      </div>
      <p className="text-[11px] font-medium text-ink">{certificatesCopy.scanPrompt}</p>
      <p className="text-[10px] leading-relaxed text-muted">{certificatesCopy.scanNote}</p>
    </div>
  );
}
