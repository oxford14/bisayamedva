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
      <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
        {authCopy.forgot.eyebrow}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-navy">
        {authCopy.forgot.title}
      </h1>
      <p className="mt-2 text-muted">{authCopy.forgot.body}</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={error}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </Field>
        {sent ? (
          <p className="rounded-[10px] bg-sand px-3 py-2 text-sm text-navy">
            {authCopy.forgot.sent}
          </p>
        ) : null}
        <Button type="submit" variant="accent" className="w-full" size="lg">
          {authCopy.forgot.submit}
        </Button>
      </form>
      <p className="mt-6 text-sm">
        <Link
          href="/auth/login"
          className="font-semibold text-navy hover:text-teal cursor-pointer"
        >
          Back to login
        </Link>
      </p>
    </div>
  );
}
