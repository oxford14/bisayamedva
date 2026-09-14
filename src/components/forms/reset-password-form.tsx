"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import {
  updatePasswordAfterRecoveryAction,
  type ResetPasswordActionState,
} from "@/app/auth/reset-password/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authCopy } from "@/content/site";
import { Field } from "./field";

const initialState: ResetPasswordActionState | null = null;

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePasswordAfterRecoveryAction,
    initialState,
  );
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.22em] text-navy/55 uppercase">
        {authCopy.resetPassword.eyebrow}
      </p>
      <h1 className="mt-3 font-display text-[clamp(1.7rem,3vw,2.1rem)] leading-[1.12] font-semibold tracking-tight text-ink">
        {authCopy.resetPassword.title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
        {authCopy.resetPassword.body}
      </p>

      <form action={formAction} className="mt-8 space-y-5" noValidate>
        <Field
          label="New password"
          htmlFor="new_password"
          error={state?.fieldErrors?.newPassword}
        >
          <div className="relative">
            <Input
              id="new_password"
              name="new_password"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              required
              aria-invalid={Boolean(state?.fieldErrors?.newPassword)}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-muted transition-colors hover:text-navy"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </Field>

        <Field
          label="Confirm new password"
          htmlFor="confirm_password"
          error={state?.fieldErrors?.confirmPassword}
        >
          <div className="relative">
            <Input
              id="confirm_password"
              name="confirm_password"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              required
              aria-invalid={Boolean(state?.fieldErrors?.confirmPassword)}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-muted transition-colors hover:text-navy"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </Field>

        {state?.ok === false && state.message ? (
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
          {pending ? "Saving..." : authCopy.resetPassword.submit}
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
