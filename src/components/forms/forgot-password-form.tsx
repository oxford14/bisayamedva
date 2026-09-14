"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  requestPasswordResetAction,
  type ForgotPasswordActionState,
} from "@/app/auth/forgot-password/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authCopy } from "@/content/site";
import { Field } from "./field";

const initialState: ForgotPasswordActionState | null = null;

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const linkError = searchParams.get("error") === "invalid_link";

  useEffect(() => {
    if (state?.fieldErrors) {
      setErrors(state.fieldErrors);
    } else if (state?.ok === false && !state.fieldErrors) {
      setErrors({});
    }
  }, [state]);

  const sent = state?.sent === true;

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

      {linkError ? (
        <p
          className="mt-4 rounded-xl bg-sand px-3.5 py-2.5 text-sm text-destructive"
          role="alert"
        >
          {authCopy.forgot.invalidLink}
        </p>
      ) : null}

      <form action={formAction} className="mt-8 space-y-5" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            aria-invalid={Boolean(errors.email)}
            className={
              errors.email
                ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                : undefined
            }
            required
          />
        </Field>

        {sent && state?.message ? (
          <p
            className="rounded-xl bg-sand px-3.5 py-2.5 text-sm text-navy"
            role="status"
          >
            {state.message}
          </p>
        ) : null}

        {state?.ok === false && state.message && !sent ? (
          <p
            className="rounded-xl bg-sand px-3.5 py-2.5 text-sm text-destructive"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="accent"
          disabled={pending}
          className="w-full rounded-full text-sm font-semibold tracking-wide shadow-[0_10px_24px_rgba(91,109,73,0.22)]"
          size="lg"
        >
          {pending ? "Sending..." : authCopy.forgot.submit}
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
