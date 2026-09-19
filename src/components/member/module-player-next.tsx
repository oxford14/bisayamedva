"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeModuleFile } from "@/app/(member)/member/modules-actions";
import { certificatesCopy, modulesCopy } from "@/content/site";
import { Button } from "@/components/ui/button";
import {
  certificateBlockedCopy,
  type CertificateContinue,
} from "@/lib/member/certificate-route";

function navigateAfterLast(
  router: ReturnType<typeof useRouter>,
  afterLast: CertificateContinue,
) {
  if (afterLast.kind === "certificate" || afterLast.kind === "hipaa_upload") {
    router.push(afterLast.href);
  }
}

export function ModulePlayerNext({
  moduleId,
  fileId,
  fallbackHref,
  isLast = false,
  courseSlug,
}: {
  moduleId: string;
  fileId: string;
  fallbackHref: string;
  isLast?: boolean;
  courseSlug?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [blocked, setBlocked] = useState<{
    title: string;
    body: string;
    ctaHref?: string;
  } | null>(null);

  return (
    <div className="flex flex-col items-end gap-2">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {blocked ? (
        <div
          className="w-full rounded-xl border border-border bg-cream/50 px-4 py-3 text-left"
          role="status"
        >
          <p className="text-sm font-semibold text-ink">{blocked.title}</p>
          <p className="mt-1 text-sm text-muted">{blocked.body}</p>
          {blocked.ctaHref ? (
            <Button asChild variant="secondary" size="sm" className="mt-3">
              <Link href={blocked.ctaHref}>
                {certificatesCopy.hipaaBlockedUploadCta}
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
      <Button
        type="button"
        variant="accent"
        disabled={pending || Boolean(blocked)}
        onClick={() => {
          setError("");
          setBlocked(null);
          startTransition(async () => {
            const result = await completeModuleFile(moduleId, fileId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            if (isLast && result.afterLast) {
              if (result.afterLast.kind === "unavailable") {
                setBlocked({
                  title: certificatesCopy.unavailableTitle,
                  body: certificatesCopy.unavailableBody,
                });
                return;
              }
              if (result.afterLast.kind === "hipaa_pending") {
                const copy = certificateBlockedCopy("hipaa_pending");
                if (copy) setBlocked(copy);
                return;
              }
              navigateAfterLast(router, result.afterLast);
              return;
            }
            router.push(result.nextHref ?? fallbackHref);
          });
        }}
      >
        {pending
          ? "Saving…"
          : isLast
            ? modulesCopy.viewCertificate
            : `${modulesCopy.nextItem} →`}
      </Button>
    </div>
  );
}
