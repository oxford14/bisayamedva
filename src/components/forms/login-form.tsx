"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authCopy, nav } from "@/content/site";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations/auth";
import { Field } from "./field";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setMessage("");
      return;
    }

    setErrors({});
    setMessage("");
    setPending(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.user) {
      setPending(false);
      setMessage(error?.message ?? "Login failed. Check your email and password.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    const next = searchParams.get("next");
    const safeNext =
      next && next.startsWith("/") && !next.startsWith("//") ? next : null;

    if (profile?.role === "SUPER_ADMIN" || profile?.role === "ADMIN") {
      router.replace(safeNext?.startsWith("/admin") ? safeNext : "/admin");
    } else {
      router.replace(safeNext && !safeNext.startsWith("/admin") ? safeNext : "/");
    }
    router.refresh();
  }

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

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
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

        {message ? (
          <p className="rounded-xl bg-sand px-3.5 py-2.5 text-sm text-destructive" role="alert">
            {message}
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
