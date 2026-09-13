"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeModuleFile } from "@/app/(member)/member/modules-actions";
import { certificatesCopy, certificatesEnabled, modulesCopy } from "@/content/site";
import { Button } from "@/components/ui/button";
import { courseCertificateHref } from "@/lib/member/certificate-shared";

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
  const [lastItemComplete, setLastItemComplete] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {isLast && !certificatesEnabled && lastItemComplete ? (
        <div
          className="w-full rounded-xl border border-border bg-cream/50 px-4 py-3 text-left"
          role="status"
        >
          <p className="text-sm font-semibold text-ink">
            {certificatesCopy.unavailableTitle}
          </p>
          <p className="mt-1 text-sm text-muted">
            {certificatesCopy.unavailableBody}
          </p>
        </div>
      ) : null}
      {lastItemComplete && courseSlug ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(`/member/modules/${courseSlug}`)}
        >
          {modulesCopy.backToModules}
        </Button>
      ) : (
      <Button
        type="button"
        variant="accent"
        disabled={pending || lastItemComplete}
        onClick={() => {
          setError("");
          startTransition(async () => {
            const result = await completeModuleFile(moduleId, fileId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            if (isLast && courseSlug && certificatesEnabled) {
              router.push(courseCertificateHref(courseSlug));
              return;
            }
            if (isLast && !certificatesEnabled) {
              setLastItemComplete(true);
              return;
            }
            router.push(result.nextHref ?? fallbackHref);
          });
        }}
      >
        {pending
          ? "Saving…"
          : isLast && !certificatesEnabled
            ? modulesCopy.finishCourseCta
            : isLast
              ? modulesCopy.viewCertificate
              : `${modulesCopy.nextItem} →`}
      </Button>
      )}
    </div>
  );
}
