"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { practiceCopy } from "@/content/site";
import { prepareRegisteredPatientFromSchedulingQuickAdd } from "@/lib/practice/patient-form";
import {
  validatePracticePatientSchedulingQuick,
  type PracticePatientSchedulingQuickValues,
} from "@/lib/practice/patient-schema";
import type { PracticePatient } from "@/lib/practice/types";

const selectClass =
  "h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-ink";

const emptyQuickAdd = (): PracticePatientSchedulingQuickValues => ({
  legalFirstName: "",
  legalMiddleName: "",
  legalLastName: "",
  dateOfBirth: "",
  sexAtBirth: "",
  phone: "",
});

function Field({
  label,
  htmlFor,
  children,
  error,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-ink">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SchedulingAddPatientPanel({
  createPatient,
  onSavePatient,
  onCancel,
  onSaved,
}: {
  createPatient: () => PracticePatient;
  onSavePatient: (patient: PracticePatient) => Promise<void>;
  onCancel: () => void;
  onSaved: (patientId: string) => void;
}) {
  const [values, setValues] = useState(emptyQuickAdd);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function updateField<K extends keyof PracticePatientSchedulingQuickValues>(
    key: K,
    value: PracticePatientSchedulingQuickValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    const parsed = validatePracticePatientSchedulingQuick(values);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string" && !errors[path]) {
          errors[path] = issue.message;
        }
      }
      setFieldErrors(errors);
      setMessage("Check the highlighted fields.");
      return;
    }

    const prepared = prepareRegisteredPatientFromSchedulingQuickAdd(
      parsed.data,
      createPatient(),
    );
    if (!prepared.ok) {
      setFieldErrors(prepared.fieldErrors);
      setMessage("Check the highlighted fields.");
      return;
    }

    setFieldErrors({});
    setMessage("");
    startTransition(async () => {
      await onSavePatient(prepared.patient);
      onSaved(prepared.patient.id);
      setValues(emptyQuickAdd());
    });
  }

  return (
    <div className="rounded-xl border border-border bg-cream/60 p-4">
      <p className="font-display text-sm font-semibold text-ink">
        {practiceCopy.schedulingAddPatientTitle}
      </p>
      <p className="mt-1 text-xs text-muted">{practiceCopy.schedulingAddPatientHint}</p>

      <div className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Legal first name"
            htmlFor="sched-add-first"
            error={fieldErrors.legalFirstName}
          >
            <Input
              id="sched-add-first"
              value={values.legalFirstName}
              onChange={(e) => updateField("legalFirstName", e.target.value)}
            />
          </Field>
          <Field
            label="Legal last name"
            htmlFor="sched-add-last"
            error={fieldErrors.legalLastName}
          >
            <Input
              id="sched-add-last"
              value={values.legalLastName}
              onChange={(e) => updateField("legalLastName", e.target.value)}
            />
          </Field>
        </div>
        <Field
          label="Middle name"
          htmlFor="sched-add-middle"
          error={fieldErrors.legalMiddleName}
        >
          <Input
            id="sched-add-middle"
            value={values.legalMiddleName}
            onChange={(e) => updateField("legalMiddleName", e.target.value)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Date of birth"
            htmlFor="sched-add-dob"
            error={fieldErrors.dateOfBirth}
          >
            <Input
              id="sched-add-dob"
              type="date"
              value={values.dateOfBirth}
              onChange={(e) => updateField("dateOfBirth", e.target.value)}
            />
          </Field>
          <Field
            label="Sex at birth"
            htmlFor="sched-add-sex"
            error={fieldErrors.sexAtBirth}
          >
            <select
              id="sched-add-sex"
              className={selectClass}
              value={values.sexAtBirth}
              onChange={(e) => updateField("sexAtBirth", e.target.value)}
            >
              <option value="">Select…</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Unknown">Unknown</option>
            </select>
          </Field>
        </div>
        <Field label="Phone" htmlFor="sched-add-phone" error={fieldErrors.phone}>
          <Input
            id="sched-add-phone"
            type="tel"
            value={values.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </Field>
      </div>

      {message ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="accent" size="sm" disabled={pending} onClick={submit}>
          {pending ? "Saving…" : practiceCopy.schedulingAddPatientSave}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={onCancel}
        >
          {practiceCopy.schedulingAddPatientCancel}
        </Button>
      </div>
    </div>
  );
}

export const SCHEDULING_ADD_PATIENT_VALUE = "__add_patient__";
