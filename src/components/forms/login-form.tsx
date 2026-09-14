"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  signInWithPasswordAction,
  type LoginActionState,
} from "@/app/auth/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authCopy, nav } from "@/content/site";
import { Field } from "./field";

const initialState: LoginActionState | null = null;

export function LoginForm() {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(
    signInWithPasswordAction,
    initialState,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const emailFromQuery = searchParams.get("email") ?? "";
  const nextFromQuery = searchParams.get("next") ?? "";

  useEffect(() => {
    if (state?.fieldErrors) {
      setErrors(state.fieldErrors);
    } else if (state?.ok === false && !state.fieldErrors) {
      setErrors({});
    }
  }, [state]);

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.22em] text-navy/55 uppercase">
        {authCopy.login.eyebrow}
      </p>
      <h1 className="mt-3 font-display text-[clamp(1.7rem,3vw,2.1rem)] leading-[1.12] font-semibold tracking-tight text-ink">
        {authCopy.login.title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
        {authCopy.login.body}
      </p>

      <form action={formAction} className="mt-8 space-y-5" noValidate>
        {nextFromQuery ? (
          <input type="hidden" name="next" value={nextFromQuery} />
        ) : null}

        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            defaultValue={emailFromQuery}
            aria-invalid={Boolean(errors.email)}
            className={
              errors.email
                ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                : undefined
            }
            required
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password}>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              className={
                errors.password
                  ? "border-destructive pr-12 focus-visible:border-destructive focus-visible:ring-destructive/20"
                  : "pr-12"
              }
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-muted transition-colors hover:text-navy"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-teal hover:text-navy cursor-pointer"
          >
            {authCopy.login.forgot}
          </Link>
        </div>

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
          {pending ? "Signing in..." : authCopy.login.submit}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted">
        {authCopy.login.noAccount}{" "}
        <Link
          href={nav.register.href}
          className="font-semibold text-teal hover:text-navy cursor-pointer"
        >
          {authCopy.login.register}
        </Link>
      </p>
    </div>
  );
}
