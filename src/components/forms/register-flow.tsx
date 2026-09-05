"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkRegisterEmail, prepareCheckoutPayment, quoteRegisterPromo } from "@/app/register/actions";
import {
  authCopy,
  experienceLevels,
  nav,
  referralSources,
} from "@/content/site";
import type { FeaturedOffer } from "@/lib/content/featured-offer";
import {
  clearRegisterDraft,
  readRegisterDraft,
  saveRegisterDraft,
} from "@/lib/register/draft";
import { registerAccountSchema } from "@/lib/validations/auth";
import { formatPeso } from "@/lib/utils";
import { Field, selectClassName } from "./field";

type AccountState = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  occupation: string;
  experienceLevel: string;
  messengerName: string;
  referralSource: string;
};

const emptyAccount: AccountState = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  password: "",
  confirmPassword: "",
  occupation: "",
  experienceLevel: "",
  messengerName: "",
  referralSource: "",
};

export function RegisterFlow({
  course,
  session,
}: {
  course: FeaturedOffer["course"];
  session: FeaturedOffer["session"];
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [account, setAccount] = useState<AccountState>(emptyAccount);
  const [sessionId, setSessionId] = useState<string>(session.id);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountLabel: string;
    finalLabel: string;
    originalLabel: string;
    finalAmount: number;
  } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoPending, startPromoTransition] = useTransition();
  const [enrollPending, startEnrollTransition] = useTransition();
  const [enrollError, setEnrollError] = useState("");

  useEffect(() => {
    const draft = readRegisterDraft();
    if (!draft) return;
    setAccount({
      firstName: draft.firstName,
      lastName: draft.lastName,
      email: draft.email,
      mobile: draft.mobile,
      password: draft.password,
      confirmPassword: draft.password,
      occupation: draft.occupation ?? "",
      experienceLevel: draft.experienceLevel ?? "",
      messengerName: draft.messengerName ?? "",
      referralSource: draft.referralSource ?? "",
    });
    setSessionId(session.id);
    if (draft.promoCode) {
      setPromoInput(draft.promoCode);
      startPromoTransition(async () => {
        const result = await quoteRegisterPromo(draft.promoCode!);
        if (result.ok) {
          setAppliedPromo({
            code: result.code,
            discountLabel: result.discountLabel,
            finalLabel: result.finalLabel,
            originalLabel: result.originalLabel,
            finalAmount: result.finalAmount,
          });
        }
      });
    }
    setStep(3);
  }, [session.id]);

  const price = formatPeso(course.price);
  const displayTotal = appliedPromo?.finalLabel ?? price;
  const isFreeEnrollment = appliedPromo?.finalAmount === 0;

  const steps = useMemo(
    () => [
      { n: 1, label: authCopy.register.stepAccount },
      { n: 2, label: authCopy.register.stepSession },
      { n: 3, label: authCopy.register.stepSummary },
    ],
    [],
  );

  function update<K extends keyof AccountState>(key: K, value: AccountState[K]) {
    setAccount((prev) => ({ ...prev, [key]: value }));
    if (key === "email" && (errors.email || emailTaken)) {
      setEmailTaken(false);
      setErrors((prev) => {
        if (!prev.email) return prev;
        const next = { ...prev };
        delete next.email;
        return next;
      });
    }
  }

  async function verifyEmailAvailable(email: string) {
    try {
      const result = await checkRegisterEmail(email);
      if (!result.ok) {
        setEmailTaken(result.code === "EMAIL_TAKEN");
        setErrors((prev) => ({ ...prev, email: result.error }));
        return false;
      }
      setEmailTaken(false);
      setErrors((prev) => {
        if (!prev.email) return prev;
        const next = { ...prev };
        delete next.email;
        return next;
      });
      return true;
    } catch {
      setEmailTaken(false);
      setErrors((prev) => ({
        ...prev,
        email: "Could not verify this email right now. Try again.",
      }));
      return false;
    }
  }

  async function submitAccount(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerAccountSchema.safeParse({
      ...account,
      occupation: account.occupation || undefined,
      experienceLevel: account.experienceLevel || undefined,
      messengerName: account.messengerName || undefined,
      referralSource: account.referralSource || undefined,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setEmailTaken(false);
      setErrors(next);
      return;
    }
    setCheckingEmail(true);
    const available = await verifyEmailAvailable(parsed.data.email);
    setCheckingEmail(false);
    if (!available) {
      document.getElementById("email")?.focus();
      return;
    }
    setErrors({});
    setStep(2);
  }

  function submitSession(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId) {
      setErrors({ session: "Please choose a weekend session." });
      return;
    }
    setErrors({});
    setStep(3);
    saveRegisterDraft({
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      mobile: account.mobile,
      password: account.password,
      occupation: account.occupation || undefined,
      experienceLevel: account.experienceLevel || undefined,
      messengerName: account.messengerName || undefined,
      referralSource: account.referralSource || undefined,
      sessionId,
    });
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
        {authCopy.register.eyebrow}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-navy">
        {authCopy.register.title}
      </h1>
      <p className="mt-2 text-muted">{authCopy.register.body}</p>

      <ol className="mt-6 grid grid-cols-3 gap-2 text-xs font-semibold">
        {steps.map((item) => (
          <li
            key={item.n}
            className={
              item.n <= step
                ? "rounded-full bg-navy px-2 py-2 text-center text-cream"
                : "rounded-full bg-sand px-2 py-2 text-center text-muted"
            }
          >
            {item.n}. {item.label}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <form onSubmit={submitAccount} className="mt-8 space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor="firstName" error={errors.firstName}>
              <Input
                id="firstName"
                value={account.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                autoComplete="given-name"
                required
              />
            </Field>
            <Field label="Last name" htmlFor="lastName" error={errors.lastName}>
              <Input
                id="lastName"
                value={account.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                autoComplete="family-name"
                required
              />
            </Field>
          </div>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              type="email"
              value={account.email}
              onChange={(e) => update("email", e.target.value)}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (!value) return;
                void verifyEmailAvailable(value);
              }}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={
                errors.email
                  ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                  : undefined
              }
              required
            />
          </Field>
          {emailTaken ? (
            <p className="text-sm text-muted">
              {authCopy.login.noAccount}{" "}
              <Link
                href={`${nav.login.href}?email=${encodeURIComponent(account.email.trim())}`}
                className="font-semibold text-navy hover:text-teal cursor-pointer"
              >
                {nav.login.label}
              </Link>
            </p>
          ) : null}
          <Field label="Mobile number" htmlFor="mobile" error={errors.mobile}>
            <Input
              id="mobile"
              type="tel"
              value={account.mobile}
              onChange={(e) => update("mobile", e.target.value)}
              autoComplete="tel"
              required
            />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password}>
            <Input
              id="password"
              type="password"
              value={account.password}
              onChange={(e) => update("password", e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          <Field
            label="Confirm password"
            htmlFor="confirmPassword"
            error={errors.confirmPassword}
          >
            <Input
              id="confirmPassword"
              type="password"
              value={account.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          <Field
            label="Occupation (optional)"
            htmlFor="occupation"
            error={errors.occupation}
          >
            <Input
              id="occupation"
              value={account.occupation}
              onChange={(e) => update("occupation", e.target.value)}
            />
          </Field>
          <Field
            label="Experience level (optional)"
            htmlFor="experienceLevel"
            error={errors.experienceLevel}
          >
            <select
              id="experienceLevel"
              className={selectClassName}
              value={account.experienceLevel}
              onChange={(e) => update("experienceLevel", e.target.value)}
            >
              <option value="">Select if you like</option>
              {experienceLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Facebook / Messenger name (optional)"
            htmlFor="messengerName"
          >
            <Input
              id="messengerName"
              value={account.messengerName}
              onChange={(e) => update("messengerName", e.target.value)}
            />
          </Field>
          <Field
            label="How did you hear about Bisaya MedVA? (optional)"
            htmlFor="referralSource"
          >
            <select
              id="referralSource"
              className={selectClassName}
              value={account.referralSource}
              onChange={(e) => update("referralSource", e.target.value)}
            >
              <option value="">Select a source</option>
              {referralSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </Field>
          <Button
            type="submit"
            variant="accent"
            className="w-full"
            size="lg"
            disabled={checkingEmail}
          >
            {checkingEmail
              ? authCopy.register.checkingEmail
              : authCopy.register.submitAccount}
          </Button>
        </form>
      ) : null}

      {step === 2 ? (
        <form onSubmit={submitSession} className="mt-8 space-y-4">
          <fieldset>
            <legend className="text-sm font-medium text-navy">
              Choose your weekend session
            </legend>
            <label className="mt-3 flex cursor-pointer gap-3 rounded-2xl border border-teal bg-white p-4 shadow-[0_8px_20px_rgba(91,109,73,0.08)]">
              <input
                type="radio"
                name="session"
                className="mt-1 size-4 accent-teal"
                checked={sessionId === session.id}
                onChange={() => setSessionId(session.id)}
              />
              <span>
                <span className="block font-semibold text-navy">
                  {session.day} · {session.dateLabel}
                </span>
                <span className="mt-1 block text-sm text-muted">
                  {session.startTime} – {session.endTime} {session.timezoneLabel}{" "}
                  · {session.format}
                </span>
              </span>
            </label>
            {errors.session ? (
              <p className="mt-2 text-sm text-destructive" role="alert">
                {errors.session}
              </p>
            ) : null}
          </fieldset>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button type="submit" variant="accent" className="flex-1">
              {authCopy.register.submitSession}
            </Button>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <div className="mt-8 space-y-5">
          <div className="rounded-2xl border border-border bg-white p-5">
            <h2 className="font-semibold text-navy">Order summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Student</dt>
                <dd className="text-right font-medium text-navy">
                  {account.firstName} {account.lastName}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Email</dt>
                <dd className="text-right text-navy">{account.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Course</dt>
                <dd className="text-right text-navy">
                  {course.name}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Session</dt>
                <dd className="text-right text-navy">
                  {session.day}, {session.startTime}–{session.endTime}{" "}
                  {session.timezoneLabel}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                Promo code
              </p>
              <div className="mt-2 flex gap-2">
                <Input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1"
                  disabled={Boolean(appliedPromo)}
                />
                {appliedPromo ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setAppliedPromo(null);
                      setPromoInput("");
                      setPromoError("");
                      setEnrollError("");
                    }}
                  >
                    Remove
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={promoPending || !promoInput.trim()}
                    onClick={() => {
                      setPromoError("");
                      startPromoTransition(async () => {
                        const result = await quoteRegisterPromo(promoInput);
                        if (!result.ok) {
                          setAppliedPromo(null);
                          setPromoError(result.error);
                          return;
                        }
                        setAppliedPromo({
                          code: result.code,
                          discountLabel: result.discountLabel,
                          finalLabel: result.finalLabel,
                          originalLabel: result.originalLabel,
                          finalAmount: result.finalAmount,
                        });
                      });
                    }}
                  >
                    {promoPending ? "…" : "Apply"}
                  </Button>
                )}
              </div>
              {promoError ? (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  {promoError}
                </p>
              ) : null}
              {appliedPromo ? (
                <p className="mt-2 text-sm text-navy">
                  Applied <span className="font-semibold">{appliedPromo.code}</span>{" "}
                  (−{appliedPromo.discountLabel})
                </p>
              ) : null}
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              {appliedPromo ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="text-right text-muted line-through">
                    {appliedPromo.originalLabel}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4 border-t border-border pt-3">
                <dt className="font-semibold text-navy">Total</dt>
                <dd className="font-display text-2xl text-navy">{displayTotal}</dd>
              </div>
            </dl>
          </div>
          {enrollError ? (
            <p className="text-sm text-destructive" role="alert">
              {enrollError}
            </p>
          ) : null}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setStep(2)}
              disabled={enrollPending}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="accent"
              className="flex-1"
              disabled={enrollPending}
              onClick={() => {
                setEnrollError("");
                const draft = {
                  firstName: account.firstName,
                  lastName: account.lastName,
                  email: account.email,
                  mobile: account.mobile,
                  password: account.password,
                  occupation: account.occupation || undefined,
                  experienceLevel: account.experienceLevel || undefined,
                  messengerName: account.messengerName || undefined,
                  referralSource: account.referralSource || undefined,
                  sessionId,
                  promoCode: appliedPromo?.code,
                };
                saveRegisterDraft(draft);

                if (isFreeEnrollment) {
                  startEnrollTransition(async () => {
                    const result = await prepareCheckoutPayment(draft);
                    if (!result.ok) {
                      setEnrollError(result.error);
                      return;
                    }
                    clearRegisterDraft();
                    router.push("/member");
                  });
                  return;
                }

                router.push("/register/checkout");
              }}
            >
              {enrollPending
                ? "Completing…"
                : isFreeEnrollment
                  ? "Complete enrollment"
                  : authCopy.register.submitPayment}
            </Button>
          </div>
        </div>
      ) : null}

      <p className="mt-6 text-sm text-muted">
        Naa na kay account?{" "}
        <Link
          href={nav.login.href}
          className="font-semibold text-navy hover:text-teal cursor-pointer"
        >
          {nav.login.label}
        </Link>
      </p>
    </div>
  );
}
