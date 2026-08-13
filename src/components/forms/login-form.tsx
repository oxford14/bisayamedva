"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authCopy, nav, site } from "@/content/site";
import { loginSchema } from "@/lib/validations/auth";
import { formatPeso } from "@/lib/utils";
import { Field } from "./field";

export function LoginForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    setMessage(
      "Login is ready as a shell. Account access will open when authentication is connected.",
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
        {authCopy.login.eyebrow}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-navy">
        {authCopy.login.title}
      </h1>
      <p className="mt-2 text-muted">{authCopy.login.body}</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-teal hover:underline cursor-pointer"
          >
            {authCopy.login.forgot}
          </Link>
        </div>
        {message ? (
          <p className="rounded-[10px] bg-sand px-3 py-2 text-sm text-navy">
            {message}
          </p>
        ) : null}
        <Button type="submit" variant="accent" className="w-full" size="lg">
          {authCopy.login.submit}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        {authCopy.login.noAccount}{" "}
        <Link
          href={nav.register.href}
          className="font-semibold text-navy hover:text-teal cursor-pointer"
        >
          {authCopy.login.register} — {formatPeso(site.featuredCourse.price)}
        </Link>
      </p>
    </div>
  );
}
