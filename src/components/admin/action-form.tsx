"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type ActionResult = { ok: true } | { ok: false; error: string };

export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  className,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
}) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setError("");
        setSuccess(false);
        startTransition(async () => {
          const result = await action(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setSuccess(true);
        });
      }}
    >
      {children}
      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-3 text-sm text-navy">Saved.</p>
      ) : null}
      <Button
        type="submit"
        variant="accent"
        className="mt-4"
        disabled={pending}
      >
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
