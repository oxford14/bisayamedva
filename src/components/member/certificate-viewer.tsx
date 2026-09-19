"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import { CertificatePrintButton } from "@/components/member/certificate-print-button";
import { ModulePdfViewer } from "@/components/member/module-pdf-viewer";
import { PageLoader } from "@/components/ui/page-loader";
import { Button } from "@/components/ui/button";
import { certificatesCopy, modulesCopy } from "@/content/site";
import { buildCertificatePdfBlob } from "@/lib/member/certificate-pdf";
import type { MemberCertificate } from "@/lib/member/certificate-shared";

export function CertificateViewer({
  certificate,
  studentName,
  generationEnabled = false,
}: {
  certificate: MemberCertificate;
  studentName: string;
  generationEnabled?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!generationEnabled) return;
    let url: string | null = null;
    let cancelled = false;
    setSrc(null);
    setError("");
    void buildCertificatePdfBlob(certificate, studentName)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setError(certificatesCopy.pdfError);
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [certificate, studentName, generationEnabled]);

  if (!generationEnabled) {
    return (
      <div
        className="flex flex-1 flex-col justify-center rounded-2xl border border-border bg-white p-6"
        role="status"
      >
        <p className="text-sm font-semibold text-ink">
          {certificatesCopy.unavailableTitle}
        </p>
        <p className="mt-2 max-w-md text-sm text-muted">
          {certificatesCopy.unavailableBody}
        </p>
      </div>
    );
  }

  async function goFullscreen() {
    const node = frameRef.current;
    if (!node) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await node.requestFullscreen();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => void goFullscreen()}>
          <Maximize2 className="size-3.5" aria-hidden />
          {modulesCopy.fullscreen}
        </Button>
        <CertificatePrintButton
          certificate={certificate}
          studentName={studentName}
          generationEnabled={generationEnabled}
          compact
        />
      </div>
      <div
        ref={frameRef}
        className="min-h-[28rem] flex-1 overflow-hidden rounded-2xl border border-border bg-white"
      >
        {error ? (
          <p className="p-6 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : src ? (
          <ModulePdfViewer src={src} />
        ) : (
          <PageLoader compact className="h-full min-h-[28rem] py-0" />
        )}
      </div>
    </div>
  );
}
