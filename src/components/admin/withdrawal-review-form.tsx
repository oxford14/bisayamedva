"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewWalletWithdrawal } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";

export function WithdrawalReviewForm({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(decision: "APPROVED" | "REJECTED") {
    setError("");
    const formData = new FormData();
    formData.set("id", id);
    formData.set("decision", decision);
    formData.set("review_note", note);

    startTransition(async () => {
      const result = await reviewWalletWithdrawal(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="min-w-[220px] space-y-2">
      <input
        type="text"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Note (optional)"
        className="h-10 w-full rounded-[10px] border border-border bg-white px-2 text-xs"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="accent"
          size="sm"
          disabled={pending}
          onClick={() => submit("APPROVED")}
        >
          {pending ? "Saving..." : "Approve"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => submit("REJECTED")}
        >
          Reject
        </Button>
      </div>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
