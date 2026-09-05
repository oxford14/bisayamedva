"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateLoungeBadge } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";

type LoungeBadgeValue = "" | "COACH" | "ADMIN";

export function LoungeBadgeForm({
  userId,
  initialBadge,
}: {
  userId: string;
  initialBadge: string | null;
}) {
  const router = useRouter();
  const [badge, setBadge] = useState<LoungeBadgeValue>(
    (initialBadge as LoungeBadgeValue) || "",
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    const formData = new FormData();
    formData.set("user_id", userId);
    formData.set("lounge_badge", badge || "none");

    startTransition(async () => {
      const result = await updateLoungeBadge(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Lounge badge saved.");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 rounded-2xl border border-border bg-white p-5"
    >
      <h2 className="font-semibold text-ink">Student Lounge badge</h2>
      <p className="mt-1 text-sm text-muted">
        Coach and Admin badges show beside their name in the Lounge. Coaches and
        Admins can also pin posts and comments.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block min-w-[12rem] flex-1 text-sm">
          <span className="mb-1.5 block font-medium text-ink">Badge</span>
          <select
            className="flex h-11 w-full rounded-[10px] border border-border bg-white px-3.5"
            value={badge}
            onChange={(e) => setBadge(e.target.value as LoungeBadgeValue)}
          >
            <option value="">None</option>
            <option value="COACH">Coach</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? "Saving…" : "Save badge"}
        </Button>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-2 text-sm text-navy" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
