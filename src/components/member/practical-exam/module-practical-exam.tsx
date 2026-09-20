"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { submitPracticalExam } from "@/app/(member)/member/practical-exam-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StateSearchSelect } from "@/components/member/practical-exam/state-search-select";
import { MemberCard } from "@/components/member/ui";
import { practicalExamCopy } from "@/content/site";
import {
  EXAM_CASE_PATIENT,
  EXAM_SCHEDULING_REQUEST,
  EXAM_SCHEDULING_SLOTS,
  formatExamCaseDob,
  PRIORITY_TASKS,
} from "@/lib/practice/practical-exam/exam-fixtures";
import {
  ADMIN_SCENARIO_QUESTIONS,
  CALL_MED_ADVICE_OPTIONS,
  CALL_UPSET_OPTIONS,
  MISTAKE_HANDLING_OPTIONS,
} from "@/lib/practice/practical-exam/rubrics";
import type { PracticalExamAttemptSummary, PracticalExamPayload } from "@/lib/practice/practical-exam/types";
import type { PracticePatientFormValues } from "@/lib/practice/patient-schema";

const selectClass =
  "h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-ink";

const emptyRegistration = (): PracticePatientFormValues => ({
  legalFirstName: "",
  legalMiddleName: "",
  legalLastName: "",
  dateOfBirth: "",
  sexAtBirth: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zip: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelationship: "",
  insurancePayer: "",
  insuranceMemberId: "",
  insuranceGroupNumber: "",
  subscriberRelationship: "Self",
  notes: "",
});

type Props = {
  courseSlug: string;
  moduleId: string;
  latestAttempt: PracticalExamAttemptSummary | null;
  nextHref?: string | null;
};

const STEPS = [
  "intro",
  "registration",
  "scheduling",
  "calls",
  "scenarios",
  "priority",
  "comms",
  "mistake",
  "review",
] as const;

type Step = (typeof STEPS)[number];

function ScenarioOptions({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { id: string; label: string }[];
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">{name}</legend>
      {options.map((opt) => (
        <label
          key={opt.id}
          className="flex cursor-pointer gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm hover:border-navy/25"
        >
          <input
            type="radio"
            name={name}
            checked={value === opt.id}
            onChange={() => onChange(opt.id)}
            className="mt-1"
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function ModulePracticalExam({
  courseSlug,
  moduleId,
  latestAttempt,
  nextHref,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(latestAttempt?.passed ? "review" : "intro");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PracticalExamAttemptSummary | null>(
    latestAttempt?.passed ? latestAttempt : null,
  );
  const [submitError, setSubmitError] = useState("");

  const [registration, setRegistration] = useState(emptyRegistration);
  const [scheduling, setScheduling] = useState({
    patientName: EXAM_SCHEDULING_REQUEST.patientName,
    provider: EXAM_SCHEDULING_REQUEST.provider,
    visitType: EXAM_SCHEDULING_REQUEST.visitType,
    date: "",
    time: "",
    location: "",
  });
  const [callMedAdvice, setCallMedAdvice] = useState("");
  const [callUpset, setCallUpset] = useState("");
  const [scenarios, setScenarios] = useState<Record<string, string>>({});
  const [priorityOrder, setPriorityOrder] = useState<string[]>(
    PRIORITY_TASKS.map((t) => t.id),
  );
  const [priorityRationale, setPriorityRationale] = useState("");
  const [commDelay, setCommDelay] = useState("");
  const [commUnclear, setCommUnclear] = useState("");
  const [commUnavailable, setCommUnavailable] = useState("");
  const [mistakeHandling, setMistakeHandling] = useState("");

  const payload: PracticalExamPayload = useMemo(
    () => ({
      registration,
      scheduling,
      callMedAdvice,
      callUpset,
      scenarios,
      priorityOrder,
      priorityRationale,
      commDelay,
      commUnclear,
      commUnavailable,
      mistakeHandling,
    }),
    [
      registration,
      scheduling,
      callMedAdvice,
      callUpset,
      scenarios,
      priorityOrder,
      priorityRationale,
      commDelay,
      commUnclear,
      commUnavailable,
      mistakeHandling,
    ],
  );

  const stepIndex = STEPS.indexOf(step);

  const movePriority = (index: number, dir: -1 | 1) => {
    const next = priorityOrder.slice();
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    setPriorityOrder(next);
  };

  const onSubmit = () => {
    setSubmitError("");
    startTransition(async () => {
      const res = await submitPracticalExam(courseSlug, moduleId, payload);
      if (!res.ok) {
        setSubmitError(res.error);
        return;
      }
      setResult({
        score: res.score,
        maxScore: res.maxScore,
        passed: res.passed,
        criticalError: res.criticalError,
        sectionScores: res.sectionScores as PracticalExamAttemptSummary["sectionScores"],
        submittedAt: new Date().toISOString(),
      });
      if (res.passed && res.nextHref) {
        router.refresh();
      }
    });
  };

  if (result && step === "review") {
    return (
      <MemberCard className="space-y-4 p-6">
        <h2 className="font-display text-xl font-semibold text-ink">
          {result.passed ? practicalExamCopy.passTitle : practicalExamCopy.failTitle}
        </h2>
        <p className="text-sm text-muted">
          {result.passed ? practicalExamCopy.passBody : practicalExamCopy.failBody}
        </p>
        {result.criticalError ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {practicalExamCopy.criticalBanner}
          </p>
        ) : null}
        <p className="text-sm font-medium text-ink">
          {practicalExamCopy.scoreLabel}: {result.score}/{result.maxScore}
        </p>
        <ul className="grid gap-1 text-sm text-muted sm:grid-cols-2">
          {Object.entries(result.sectionScores).map(([key, val]) => (
            <li key={key}>
              {key}: {val}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          {!result.passed ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setResult(null);
                setStep("intro");
              }}
            >
              {practicalExamCopy.retake}
            </Button>
          ) : null}
          {result.passed && nextHref ? (
            <Button type="button" onClick={() => router.push(nextHref)}>
              {practicalExamCopy.continueNext}
            </Button>
          ) : null}
        </div>
      </MemberCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 text-xs text-muted">
        {STEPS.filter((s) => s !== "intro").map((s, i) => (
          <span
            key={s}
            className={
              STEPS.indexOf(s) <= stepIndex ? "font-semibold text-navy" : ""
            }
          >
            {i + 1}. {s}
          </span>
        ))}
      </div>

      {step === "intro" ? (
        <MemberCard className="space-y-4 p-6">
          <h2 className="font-display text-xl font-semibold text-ink">
            {practicalExamCopy.introTitle}
          </h2>
          <p className="text-sm leading-relaxed text-muted">{practicalExamCopy.introLead}</p>
          <h3 className="text-sm font-semibold text-ink">{practicalExamCopy.rulesTitle}</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {practicalExamCopy.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <Button type="button" onClick={() => setStep("registration")}>
            {practicalExamCopy.startExam}
          </Button>
        </MemberCard>
      ) : null}

      {step === "registration" ? (
        <MemberCard className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">{practicalExamCopy.stepRegistration}</h2>
          <div className="rounded-xl bg-cream px-4 py-3 text-sm text-muted">
            <p className="font-semibold text-ink">{practicalExamCopy.scenarioCardTitle}</p>
            <p className="mt-2">
              First name: {EXAM_CASE_PATIENT.legalFirstName} · Middle name:{" "}
              {EXAM_CASE_PATIENT.legalMiddleName} · Last name:{" "}
              {EXAM_CASE_PATIENT.legalLastName}
            </p>
            <p>
              DOB {formatExamCaseDob(EXAM_CASE_PATIENT.dateOfBirth)} · Female · (612)
              555-0184 · emily.carter@example.com
            </p>
            <p>2458 Lakeview Drive, Minneapolis, Minnesota 55416</p>
            <p>Emergency: Daniel Carter (612) 555-0142, Spouse</p>
            <p>Insurance: BCBS Minnesota · ABC123456789 · GRP45678</p>
          </div>
          <p className="text-sm text-muted">{practicalExamCopy.registrationHint}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="legalFirstName">First name</Label>
              <Input
                id="legalFirstName"
                value={registration.legalFirstName}
                onChange={(e) =>
                  setRegistration((r) => ({ ...r, legalFirstName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="legalMiddleName">Middle name</Label>
              <Input
                id="legalMiddleName"
                value={registration.legalMiddleName}
                onChange={(e) =>
                  setRegistration((r) => ({ ...r, legalMiddleName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="legalLastName">Last name</Label>
              <Input
                id="legalLastName"
                value={registration.legalLastName}
                onChange={(e) =>
                  setRegistration((r) => ({ ...r, legalLastName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={registration.dateOfBirth}
                onChange={(e) =>
                  setRegistration((r) => ({ ...r, dateOfBirth: e.target.value }))
                }
                className="[color-scheme:light]"
              />
              {registration.dateOfBirth ? (
                <p className="text-xs text-muted">
                  Selected: {formatExamCaseDob(registration.dateOfBirth)}
                </p>
              ) : (
                <p className="text-xs text-muted">Use the calendar to pick the date.</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="sexAtBirth">Sex at birth</Label>
              <select
                id="sexAtBirth"
                className={selectClass}
                value={registration.sexAtBirth}
                onChange={(e) =>
                  setRegistration((r) => ({ ...r, sexAtBirth: e.target.value }))
                }
              >
                <option value="">Select…</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={registration.phone}
                onChange={(e) =>
                  setRegistration((r) => ({ ...r, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={registration.email}
                onChange={(e) =>
                  setRegistration((r) => ({ ...r, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="addressLine1">Address</Label>
              <Input
                id="addressLine1"
                value={registration.addressLine1}
                onChange={(e) =>
                  setRegistration((r) => ({ ...r, addressLine1: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={registration.city}
                onChange={(e) =>
                  setRegistration((r) => ({ ...r, city: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="state">State</Label>
              <StateSearchSelect
                id="state"
                value={registration.state}
                onChange={(state) =>
                  setRegistration((r) => ({ ...r, state }))
                }
              />
            </div>
            <div className="space-y-1 sm:max-w-xs">
              <Label htmlFor="zip">ZIP</Label>
              <Input
                id="zip"
                value={registration.zip}
                onChange={(e) =>
                  setRegistration((r) => ({ ...r, zip: e.target.value }))
                }
              />
            </div>
            {(
              [
                ["emergencyContactName", "Emergency contact"],
                ["emergencyContactPhone", "Emergency phone"],
                ["emergencyContactRelationship", "Relationship"],
                ["insurancePayer", "Payer"],
                ["insuranceMemberId", "Member ID"],
                ["insuranceGroupNumber", "Group number"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={registration[key]}
                  onChange={(e) =>
                    setRegistration((r) => ({ ...r, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="secondary" onClick={() => setStep("intro")}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep("scheduling")}>
              Next
            </Button>
          </div>
        </MemberCard>
      ) : null}

      {step === "scheduling" ? (
        <MemberCard className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">{practicalExamCopy.stepScheduling}</h2>
          <p className="text-sm text-muted">{practicalExamCopy.schedulingHint}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Patient</Label>
              <Input value={scheduling.patientName} readOnly className="bg-cream" />
            </div>
            <div>
              <Label>Provider</Label>
              <Input value={scheduling.provider} readOnly className="bg-cream" />
            </div>
            <div>
              <Label>Visit type</Label>
              <Input value={scheduling.visitType} readOnly className="bg-cream" />
            </div>
            <div>
              <Label>Available slot</Label>
              <select
                className={selectClass}
                value={
                  EXAM_SCHEDULING_SLOTS.find(
                    (s) =>
                      s.date === scheduling.date &&
                      s.time === scheduling.time &&
                      s.location === scheduling.location,
                  )?.id ?? ""
                }
                onChange={(e) => {
                  const picked = EXAM_SCHEDULING_SLOTS.find(
                    (s) => s.id === e.target.value,
                  );
                  if (picked) {
                    setScheduling((s) => ({
                      ...s,
                      date: picked.date,
                      time: picked.time,
                      location: picked.location,
                    }));
                  }
                }}
              >
                <option value="">Select a slot</option>
                {EXAM_SCHEDULING_SLOTS.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.label} · {slot.provider} · {slot.location}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="secondary" onClick={() => setStep("registration")}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep("calls")}>
              Next
            </Button>
          </div>
        </MemberCard>
      ) : null}

      {step === "calls" ? (
        <MemberCard className="space-y-6 p-6">
          <h2 className="font-display text-lg font-semibold">{practicalExamCopy.stepCalls}</h2>
          <div>
            <p className="mb-2 text-sm font-medium text-ink">{practicalExamCopy.callMedPrompt}</p>
            <ScenarioOptions
              name="med"
              value={callMedAdvice}
              onChange={setCallMedAdvice}
              options={CALL_MED_ADVICE_OPTIONS}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-ink">{practicalExamCopy.callUpsetPrompt}</p>
            <ScenarioOptions
              name="upset"
              value={callUpset}
              onChange={setCallUpset}
              options={CALL_UPSET_OPTIONS}
            />
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="secondary" onClick={() => setStep("scheduling")}>
              Back
            </Button>
            <Button
              type="button"
              disabled={!callMedAdvice || !callUpset}
              onClick={() => setStep("scenarios")}
            >
              Next
            </Button>
          </div>
        </MemberCard>
      ) : null}

      {step === "scenarios" ? (
        <MemberCard className="space-y-6 p-6">
          <h2 className="font-display text-lg font-semibold">{practicalExamCopy.stepScenarios}</h2>
          {ADMIN_SCENARIO_QUESTIONS.map((q) => (
            <div key={q.id}>
              <p className="mb-2 text-sm font-medium text-ink">{q.prompt}</p>
              <ScenarioOptions
                name={q.id}
                value={scenarios[q.id] ?? ""}
                onChange={(v) => setScenarios((s) => ({ ...s, [q.id]: v }))}
                options={q.options}
              />
            </div>
          ))}
          <div className="flex justify-between">
            <Button type="button" variant="secondary" onClick={() => setStep("calls")}>
              Back
            </Button>
            <Button
              type="button"
              disabled={ADMIN_SCENARIO_QUESTIONS.some((q) => !scenarios[q.id])}
              onClick={() => setStep("priority")}
            >
              Next
            </Button>
          </div>
        </MemberCard>
      ) : null}

      {step === "priority" ? (
        <MemberCard className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">{practicalExamCopy.stepPriority}</h2>
          <p className="text-sm text-muted">{practicalExamCopy.priorityHint}</p>
          <ol className="space-y-2">
            {priorityOrder.map((id, index) => {
              const task = PRIORITY_TASKS.find((t) => t.id === id);
              return (
                <li
                  key={id}
                  className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-navy">{index + 1}.</span>
                  <span className="flex-1">{task?.label}</span>
                  <Button type="button" size="sm" variant="ghost" onClick={() => movePriority(index, -1)}>
                    ↑
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => movePriority(index, 1)}>
                    ↓
                  </Button>
                </li>
              );
            })}
          </ol>
          <Label htmlFor="rationale">Why this order?</Label>
          <textarea
            id="rationale"
            className="min-h-24 w-full rounded-xl border border-border px-3 py-2 text-sm"
            value={priorityRationale}
            onChange={(e) => setPriorityRationale(e.target.value)}
          />
          <div className="flex justify-between">
            <Button type="button" variant="secondary" onClick={() => setStep("scenarios")}>
              Back
            </Button>
            <Button
              type="button"
              disabled={priorityRationale.trim().length < 10}
              onClick={() => setStep("comms")}
            >
              Next
            </Button>
          </div>
        </MemberCard>
      ) : null}

      {step === "comms" ? (
        <MemberCard className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">{practicalExamCopy.stepComms}</h2>
          <div>
            <Label>{practicalExamCopy.commDelayPrompt}</Label>
            <textarea
              className="mt-1 min-h-20 w-full rounded-xl border border-border px-3 py-2 text-sm"
              value={commDelay}
              onChange={(e) => setCommDelay(e.target.value)}
            />
          </div>
          <div>
            <Label>{practicalExamCopy.commUnclearPrompt}</Label>
            <textarea
              className="mt-1 min-h-20 w-full rounded-xl border border-border px-3 py-2 text-sm"
              value={commUnclear}
              onChange={(e) => setCommUnclear(e.target.value)}
            />
          </div>
          <div>
            <Label>{practicalExamCopy.commUnavailablePrompt}</Label>
            <textarea
              className="mt-1 min-h-20 w-full rounded-xl border border-border px-3 py-2 text-sm"
              value={commUnavailable}
              onChange={(e) => setCommUnavailable(e.target.value)}
            />
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="secondary" onClick={() => setStep("priority")}>
              Back
            </Button>
            <Button
              type="button"
              disabled={
                commDelay.trim().length < 10 ||
                commUnclear.trim().length < 10 ||
                commUnavailable.trim().length < 10
              }
              onClick={() => setStep("mistake")}
            >
              Next
            </Button>
          </div>
        </MemberCard>
      ) : null}

      {step === "mistake" ? (
        <MemberCard className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">{practicalExamCopy.stepMistake}</h2>
          <p className="text-sm text-muted">You realize you made a mistake during your shift. First step?</p>
          <ScenarioOptions
            name="mistake"
            value={mistakeHandling}
            onChange={setMistakeHandling}
            options={MISTAKE_HANDLING_OPTIONS}
          />
          <div className="flex justify-between">
            <Button type="button" variant="secondary" onClick={() => setStep("comms")}>
              Back
            </Button>
            <Button type="button" disabled={!mistakeHandling} onClick={() => setStep("review")}>
              Next
            </Button>
          </div>
        </MemberCard>
      ) : null}

      {step === "review" ? (
        <MemberCard className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">{practicalExamCopy.stepReview}</h2>
          <p className="text-sm text-muted">
            Submit when ready — grading runs on the server. Passing score is 80/100 with no critical errors.
          </p>
          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
          <div className="flex justify-between">
            <Button type="button" variant="secondary" onClick={() => setStep("mistake")}>
              Back
            </Button>
            <Button type="button" disabled={pending} onClick={onSubmit}>
              {pending ? practicalExamCopy.submitting : practicalExamCopy.submitExam}
            </Button>
          </div>
        </MemberCard>
      ) : null}
    </div>
  );
}
