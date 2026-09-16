"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { PracticeDisclaimer } from "@/components/member/practice/practice-disclaimer";
import { MemberCard, MemberStatusBadge } from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { practiceCopy } from "@/content/site";
import { US_STATES } from "@/lib/practice/constants";
import {
  validatePracticePatient,
  type PracticePatientFormValues,
} from "@/lib/practice/patient-schema";
import type { PracticePatient } from "@/lib/practice/types";
import { usePracticePatients } from "@/lib/practice/use-practice-patients";
import { cn } from "@/lib/utils";

const selectClass =
  "h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-ink";

function patientToForm(p: PracticePatient): PracticePatientFormValues {
  return {
    legalFirstName: p.legalFirstName,
    legalMiddleName: p.legalMiddleName,
    legalLastName: p.legalLastName,
    dateOfBirth: p.dateOfBirth,
    sexAtBirth: p.sexAtBirth,
    phone: p.phone,
    email: p.email,
    addressLine1: p.addressLine1,
    addressLine2: p.addressLine2,
    city: p.city,
    state: p.state,
    zip: p.zip,
    emergencyContactName: p.emergencyContactName,
    emergencyContactPhone: p.emergencyContactPhone,
    emergencyContactRelationship: p.emergencyContactRelationship,
    insurancePayer: p.insurancePayer,
    insuranceMemberId: p.insuranceMemberId,
    insuranceGroupNumber: p.insuranceGroupNumber,
    subscriberRelationship: p.subscriberRelationship,
    notes: p.notes,
  };
}

function formToPatient(
  base: PracticePatient,
  values: PracticePatientFormValues,
  status: PracticePatient["status"],
): PracticePatient {
  return {
    ...base,
    ...values,
    state: values.state || "",
    status,
  };
}

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

export function PatientRegistrationWorkspace({
  ownerUserId,
}: {
  ownerUserId: string;
}) {
  const {
    patients,
    loading,
    error,
    savePatient,
    removePatient,
    createPatient,
  } = usePracticePatients(ownerUserId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PracticePatient | null>(null);
  const [search, setSearch] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const selected = useMemo(() => {
    if (draft) return draft;
    if (!selectedId) return null;
    return patients.find((p) => p.id === selectedId) ?? null;
  }, [draft, patients, selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      `${p.legalLastName} ${p.legalFirstName}`.toLowerCase().includes(q),
    );
  }, [patients, search]);

  function selectPatient(p: PracticePatient) {
    setDraft(null);
    setSelectedId(p.id);
    setFieldErrors({});
    setMessage("");
  }

  function onNew() {
    const empty = createPatient();
    setDraft(empty);
    setSelectedId(empty.id);
    setFieldErrors({});
    setMessage("");
  }

  function updateField<K extends keyof PracticePatientFormValues>(
    key: K,
    value: PracticePatientFormValues[K],
  ) {
    if (!selected) return;
    const next = formToPatient(
      selected,
      { ...patientToForm(selected), [key]: value },
      selected.status,
    );
    if (draft) setDraft(next);
    else {
      setDraft(next);
      setSelectedId(next.id);
    }
  }

  function persist(status: PracticePatient["status"]) {
    if (!selected) return;
    const values = patientToForm(selected);
    const parsed = validatePracticePatient(values, status);
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

    setFieldErrors({});
    startTransition(async () => {
      const saved = await savePatient(formToPatient(selected, parsed.data, status));
      setDraft(null);
      setSelectedId(saved.id);
      setMessage(
        status === "registered"
          ? "Patient marked registered (simulation)."
          : "Draft saved locally.",
      );
    });
  }

  function onDelete() {
    if (!selected) return;
    if (!window.confirm(practiceCopy.deleteConfirm)) return;
    startTransition(async () => {
      await removePatient(selected.id);
      setDraft(null);
      setSelectedId(null);
      setMessage("Patient deleted from practice storage.");
    });
  }

  const formValues = selected ? patientToForm(selected) : null;

  return (
    <div className="space-y-4">
      <PracticeDisclaimer />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="accent" onClick={onNew}>
          {practiceCopy.newPatient}
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/member/practice">Back to Practice Lab</Link>
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
        <MemberCard className="p-0">
          <div className="border-b border-border p-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={practiceCopy.searchPlaceholder}
              aria-label={practiceCopy.searchPlaceholder}
            />
          </div>
          <ul className="max-h-[420px] overflow-y-auto p-2">
            {loading ? (
              <li className="px-2 py-6 text-center text-sm text-muted">Loading…</li>
            ) : filtered.length === 0 ? (
              <li className="px-2 py-6 text-center text-sm text-muted">
                No patients found.
              </li>
            ) : (
              filtered.map((p) => {
                const active = selected?.id === p.id;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => selectPatient(p)}
                      className={cn(
                        "flex w-full flex-col items-start gap-1 rounded-xl px-3 py-2.5 text-left transition-colors",
                        active ? "bg-teal-bright/20" : "hover:bg-cream/80",
                      )}
                    >
                      <span className="font-medium text-ink">
                        {p.legalLastName}, {p.legalFirstName}
                      </span>
                      <MemberStatusBadge
                        status={p.status === "registered" ? "ACTIVE" : "DRAFT"}
                      />
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </MemberCard>

        <MemberCard>
          {!formValues ? (
            <p className="text-sm text-muted">{practiceCopy.selectPatient}</p>
          ) : (
            <form
              className="space-y-8"
              onSubmit={(e) => {
                e.preventDefault();
                persist("registered");
              }}
            >
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">
                  {formValues.legalLastName || "New"},{" "}
                  {formValues.legalFirstName || "patient"}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {practiceCopy.storageNote}
                </p>
              </div>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold tracking-wide text-navy/70 uppercase">
                  {practiceCopy.sectionDemographics}
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field
                    label="Legal first name"
                    htmlFor="legalFirstName"
                    error={fieldErrors.legalFirstName}
                  >
                    <Input
                      id="legalFirstName"
                      value={formValues.legalFirstName}
                      onChange={(e) =>
                        updateField("legalFirstName", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Legal middle name" htmlFor="legalMiddleName">
                    <Input
                      id="legalMiddleName"
                      value={formValues.legalMiddleName}
                      onChange={(e) =>
                        updateField("legalMiddleName", e.target.value)
                      }
                    />
                  </Field>
                  <Field
                    label="Legal last name"
                    htmlFor="legalLastName"
                    error={fieldErrors.legalLastName}
                  >
                    <Input
                      id="legalLastName"
                      value={formValues.legalLastName}
                      onChange={(e) =>
                        updateField("legalLastName", e.target.value)
                      }
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Date of birth"
                    htmlFor="dateOfBirth"
                    error={fieldErrors.dateOfBirth}
                  >
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formValues.dateOfBirth}
                      onChange={(e) =>
                        updateField("dateOfBirth", e.target.value)
                      }
                    />
                  </Field>
                  <Field
                    label="Sex at birth"
                    htmlFor="sexAtBirth"
                    error={fieldErrors.sexAtBirth}
                  >
                    <select
                      id="sexAtBirth"
                      className={selectClass}
                      value={formValues.sexAtBirth}
                      onChange={(e) =>
                        updateField("sexAtBirth", e.target.value)
                      }
                    >
                      <option value="">Select…</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </Field>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold tracking-wide text-navy/70 uppercase">
                  {practiceCopy.sectionContact}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone" htmlFor="phone" error={fieldErrors.phone}>
                    <Input
                      id="phone"
                      value={formValues.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                    />
                  </Field>
                  <Field label="Email" htmlFor="email" error={fieldErrors.email}>
                    <Input
                      id="email"
                      type="email"
                      value={formValues.email}
                      onChange={(e) => updateField("email", e.target.value)}
                    />
                  </Field>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold tracking-wide text-navy/70 uppercase">
                  {practiceCopy.sectionAddress}
                </h3>
                <Field
                  label="Address line 1"
                  htmlFor="addressLine1"
                  error={fieldErrors.addressLine1}
                >
                  <Input
                    id="addressLine1"
                    value={formValues.addressLine1}
                    onChange={(e) =>
                      updateField("addressLine1", e.target.value)
                    }
                  />
                </Field>
                <Field label="Address line 2" htmlFor="addressLine2">
                  <Input
                    id="addressLine2"
                    value={formValues.addressLine2}
                    onChange={(e) =>
                      updateField("addressLine2", e.target.value)
                    }
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="City" htmlFor="city" error={fieldErrors.city}>
                    <Input
                      id="city"
                      value={formValues.city}
                      onChange={(e) => updateField("city", e.target.value)}
                    />
                  </Field>
                  <Field label="State" htmlFor="state" error={fieldErrors.state}>
                    <select
                      id="state"
                      className={selectClass}
                      value={formValues.state}
                      onChange={(e) => updateField("state", e.target.value)}
                    >
                      <option value="">Select…</option>
                      {US_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="ZIP" htmlFor="zip" error={fieldErrors.zip}>
                    <Input
                      id="zip"
                      value={formValues.zip}
                      onChange={(e) => updateField("zip", e.target.value)}
                    />
                  </Field>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold tracking-wide text-navy/70 uppercase">
                  {practiceCopy.sectionEmergency}
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field
                    label="Contact name"
                    htmlFor="emergencyContactName"
                    error={fieldErrors.emergencyContactName}
                  >
                    <Input
                      id="emergencyContactName"
                      value={formValues.emergencyContactName}
                      onChange={(e) =>
                        updateField("emergencyContactName", e.target.value)
                      }
                    />
                  </Field>
                  <Field
                    label="Contact phone"
                    htmlFor="emergencyContactPhone"
                    error={fieldErrors.emergencyContactPhone}
                  >
                    <Input
                      id="emergencyContactPhone"
                      value={formValues.emergencyContactPhone}
                      onChange={(e) =>
                        updateField("emergencyContactPhone", e.target.value)
                      }
                    />
                  </Field>
                  <Field
                    label="Relationship"
                    htmlFor="emergencyContactRelationship"
                    error={fieldErrors.emergencyContactRelationship}
                  >
                    <Input
                      id="emergencyContactRelationship"
                      value={formValues.emergencyContactRelationship}
                      onChange={(e) =>
                        updateField(
                          "emergencyContactRelationship",
                          e.target.value,
                        )
                      }
                    />
                  </Field>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold tracking-wide text-navy/70 uppercase">
                  {practiceCopy.sectionInsurance}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Payer name"
                    htmlFor="insurancePayer"
                    error={fieldErrors.insurancePayer}
                  >
                    <Input
                      id="insurancePayer"
                      value={formValues.insurancePayer}
                      onChange={(e) =>
                        updateField("insurancePayer", e.target.value)
                      }
                    />
                  </Field>
                  <Field
                    label="Member ID"
                    htmlFor="insuranceMemberId"
                    error={fieldErrors.insuranceMemberId}
                  >
                    <Input
                      id="insuranceMemberId"
                      value={formValues.insuranceMemberId}
                      onChange={(e) =>
                        updateField("insuranceMemberId", e.target.value)
                      }
                    />
                  </Field>
                  <Field
                    label="Group number"
                    htmlFor="insuranceGroupNumber"
                    error={fieldErrors.insuranceGroupNumber}
                  >
                    <Input
                      id="insuranceGroupNumber"
                      value={formValues.insuranceGroupNumber}
                      onChange={(e) =>
                        updateField("insuranceGroupNumber", e.target.value)
                      }
                    />
                  </Field>
                  <Field
                    label="Patient relationship to subscriber"
                    htmlFor="subscriberRelationship"
                    error={fieldErrors.subscriberRelationship}
                  >
                    <Input
                      id="subscriberRelationship"
                      value={formValues.subscriberRelationship}
                      onChange={(e) =>
                        updateField("subscriberRelationship", e.target.value)
                      }
                    />
                  </Field>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold tracking-wide text-navy/70 uppercase">
                  {practiceCopy.sectionNotes}
                </h3>
                <textarea
                  className="min-h-[88px] w-full rounded-[10px] border border-border bg-white px-3 py-2 text-sm text-ink"
                  value={formValues.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  aria-label={practiceCopy.sectionNotes}
                />
              </section>

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => persist("draft")}
                >
                  {practiceCopy.saveDraft}
                </Button>
                <Button type="submit" variant="accent" disabled={pending}>
                  {practiceCopy.markRegistered}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={onDelete}
                  className="text-destructive"
                >
                  {practiceCopy.deletePatient}
                </Button>
              </div>
            </form>
          )}
        </MemberCard>
      </div>

      {message ? (
        <p className="text-sm text-navy" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
