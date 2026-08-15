"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authCopy } from "@/content/site";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { Field } from "./field";

export function ForgotPasswordForm() {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = forgotPasswordSchema.safeParse({
      email: String(form.get("email") ?? ""),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please enter a valid email.");
      setSent(false);
      return;
    }
    setError("");
    setSent(true);
  }

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.22em] text-navy/55 uppercase">
        {authCopy.forgot.eyebrow}
      </p>
      <h1 className="mt-3 font-display text-[clamp(1.7rem,3vw,2.1rem)] leading-[1.12] font-semibold tracking-tight text-ink">
        {authCopy.forgot.title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
        {authCopy.forgot.body}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <Field label="Email" htmlFor="email" error={error}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            aria-invalid={Boolean(error)}
            className={
              error
                ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                : undefined
            }
            required
          />
        </Field>

        {sent ? (
          <p className="rounded-xl bg-sand px-3.5 py-2.5 text-sm text-navy">
            {authCopy.forgot.sent}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="accent"
          className="w-full rounded-full text-sm font-semibold tracking-wide shadow-[0_10px_24px_rgba(91,109,73,0.22)]"
          size="lg"
        >
          {authCopy.forgot.submit}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm">
        <Link
          href="/auth/login"
          className="font-semibold text-teal hover:text-navy cursor-pointer"
        >
          Back to login
        </Link>
      </p>
    </div>
  );
}
