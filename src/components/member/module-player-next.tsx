"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeModuleFile } from "@/app/(member)/member/modules-actions";
import { modulesCopy } from "@/content/site";
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

  return (
    <div className="flex flex-col items-end gap-2">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="accent"
        disabled={pending}
        onClick={() => {
          setError("");
          startTransition(async () => {
            const result = await completeModuleFile(moduleId, fileId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            if (isLast && courseSlug) {
              router.push(courseCertificateHref(courseSlug));
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
