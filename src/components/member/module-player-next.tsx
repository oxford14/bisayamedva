"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeModuleFile } from "@/app/(member)/member/modules-actions";
import { modulesCopy } from "@/content/site";
import { Button } from "@/components/ui/button";

export function ModulePlayerNext({
  moduleId,
  fileId,
  fallbackHref,
}: {
  moduleId: string;
  fileId: string;
  fallbackHref: string;
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
            router.push(result.nextHref ?? fallbackHref);
          });
        }}
      >
        {pending ? "Saving…" : `${modulesCopy.nextItem} →`}
      </Button>
    </div>
  );
}
