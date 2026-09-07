"use client";

import { useState } from "react";
import { certificatesCopy } from "@/content/site";
import { Button } from "@/components/ui/button";
import { captureCertificatePdf } from "@/lib/member/certificate-pdf";
import type { MemberCertificate } from "@/lib/member/certificate-shared";

export function CertificatePrintButton({
  certificate,
  studentName,
  compact = false,
}: {
  certificate: MemberCertificate;
  studentName: string;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function savePdf() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await captureCertificatePdf(certificate, studentName);
    } catch {
      setError(certificatesCopy.pdfError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? undefined : "flex flex-col items-end gap-2"}>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant={compact ? "secondary" : "accent"}
        size={compact ? "sm" : "default"}
        onClick={() => void savePdf()}
        disabled={busy}
      >
        {busy ? certificatesCopy.savingPdf : certificatesCopy.print}
      </Button>
    </div>
  );
}
