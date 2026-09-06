"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignEnrollmentSession } from "@/app/(member)/member/actions";
import { scheduleCopy } from "@/content/site";
import { Button } from "@/components/ui/button";

export function ScheduleAssignButton({
  enrollmentId,
  sessionId,
}: {
  enrollmentId: string;
  sessionId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-6">
      {error ? (
        <p className="mb-2 text-sm text-destructive" role="alert">
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
            const result = await assignEnrollmentSession(enrollmentId, sessionId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? scheduleCopy.choosing : scheduleCopy.chooseSession}
      </Button>
    </div>
  );
}
