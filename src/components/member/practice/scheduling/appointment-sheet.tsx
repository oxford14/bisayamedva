"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { practiceCopy } from "@/content/site";
import {
  validatePracticeAppointment,
  type PracticeAppointmentFormValues,
} from "@/lib/practice/appointment-schema";
import {
  PRACTICE_APPOINTMENT_DURATIONS,
  PRACTICE_APPOINTMENT_LOCATIONS,
  PRACTICE_PROVIDERS,
  PRACTICE_VISIT_TYPES,
} from "@/lib/practice/constants";
import type {
  PracticeAppointment,
  PracticeAppointmentKind,
  PracticePatient,
} from "@/lib/practice/types";
import { cn } from "@/lib/utils";

const selectClass =
  "h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-ink";

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function appointmentToForm(a: PracticeAppointment): PracticeAppointmentFormValues {
  if (a.kind === "block") {
    return {
      kind: "block",
      patientId: "",
      providerName: a.providerName as PracticeAppointmentFormValues["providerName"],
      visitType: "",
      location: a.location,
      startsAt: a.startsAt,
      durationMinutes: a.durationMinutes,
      reasonForVisit: a.reasonForVisit,
      status: a.status,
      notes: a.notes,
    };
  }
  const visitType = (PRACTICE_VISIT_TYPES as readonly string[]).includes(
    a.visitType,
  )
    ? (a.visitType as (typeof PRACTICE_VISIT_TYPES)[number])
    : "Follow-up";
  return {
    kind: "appointment",
    patientId: a.patientId,
    providerName: a.providerName as PracticeAppointmentFormValues["providerName"],
    visitType,
    location: a.location,
    startsAt: a.startsAt,
    durationMinutes: a.durationMinutes,
    reasonForVisit: a.reasonForVisit,
    status: a.status,
    notes: a.notes,
  };
}

function formToAppointment(
  base: PracticeAppointment,
  values: PracticeAppointmentFormValues,
): PracticeAppointment {
  return {
    ...base,
    ...values,
    durationMinutes: Number(values.durationMinutes),
  };
}

const STATUS_OPTIONS = [
  { value: "scheduled", label: practiceCopy.schedulingStatusScheduled },
  { value: "checked_in", label: practiceCopy.schedulingStatusCheckedIn },
  { value: "completed", label: practiceCopy.schedulingStatusCompleted },
  { value: "cancelled", label: practiceCopy.schedulingStatusCancelled },
  { value: "no_show", label: practiceCopy.schedulingStatusNoShow },
] as const;

function AppointmentSheetPanel({
  titleId,
  appointment,
  registeredPatients,
  onClose,
  onSave,
  onDelete,
}: {
  titleId: string;
  appointment: PracticeAppointment;
  registeredPatients: PracticePatient[];
  onClose: () => void;
  onSave: (next: PracticeAppointment) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [draft, setDraft] = useState(appointment);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setDraft(appointment);
    setFieldErrors({});
    setMessage("");
  }, [appointment]);

  const formValues = appointmentToForm(draft);
  const isBlock = draft.kind === "block";

  function setKind(kind: PracticeAppointmentKind) {
    setDraft((prev) =>
      kind === "block"
        ? {
            ...prev,
            kind: "block",
            patientId: "",
            visitType: "",
          }
        : {
            ...prev,
            kind: "appointment",
            patientId:
              prev.patientId ||
              registeredPatients[0]?.id ||
              "",
          },
    );
  }

  function updateForm(partial: Partial<PracticeAppointmentFormValues>) {
    setDraft((prev) =>
      formToAppointment(prev, {
        ...appointmentToForm(prev),
        ...partial,
      } as PracticeAppointmentFormValues),
    );
  }

  function submit() {
    const values = appointmentToForm(draft);
    const parsed = validatePracticeAppointment(values);
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
      await onSave(formToAppointment(draft, parsed.data));
      onClose();
    });
  }

  return (
    <div
      className="flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl md:max-h-[85vh] md:rounded-2xl"
      role="dialog"
      aria-labelledby={titleId}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="border-b border-border px-5 py-4">
        <h2 id={titleId} className="font-display text-lg font-semibold text-ink">
          {!appointment.providerName && !appointment.reasonForVisit
            ? practiceCopy.schedulingBookAppointment
            : practiceCopy.schedulingEditAppointment}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-4 flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={!isBlock ? "accent" : "secondary"}
            onClick={() => setKind("appointment")}
          >
            {practiceCopy.schedulingKindAppointment}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isBlock ? "accent" : "secondary"}
            onClick={() => setKind("block")}
          >
            {practiceCopy.schedulingKindBlock}
          </Button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {!isBlock ? (
            <Field label={practiceCopy.schedulingPatient} error={fieldErrors.patientId}>
              <select
                className={selectClass}
                value={formValues.kind === "appointment" ? formValues.patientId : ""}
                onChange={(e) => updateForm({ patientId: e.target.value })}
              >
                <option value="">Select patient</option>
                {registeredPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.legalLastName}, {p.legalFirstName}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          <Field label={practiceCopy.schedulingProvider} error={fieldErrors.providerName}>
            <select
              className={selectClass}
              value={formValues.providerName}
              onChange={(e) =>
                updateForm({
                  providerName:
                    e.target.value as PracticeAppointmentFormValues["providerName"],
                })
              }
            >
              <option value="">Select provider</option>
              {PRACTICE_PROVIDERS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </Field>

          {!isBlock ? (
            <Field label={practiceCopy.schedulingVisitType} error={fieldErrors.visitType}>
              <select
                className={selectClass}
                value={
                  formValues.kind === "appointment" ? formValues.visitType : ""
                }
                onChange={(e) =>
                  updateForm({
                    visitType:
                      e.target.value as PracticeAppointmentFormValues["visitType"],
                  })
                }
              >
                <option value="">Select visit type</option>
                {PRACTICE_VISIT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={practiceCopy.schedulingLocation} error={fieldErrors.location}>
              <select
                className={selectClass}
                value={formValues.location}
                onChange={(e) =>
                  updateForm({
                    location:
                      e.target.value as PracticeAppointmentFormValues["location"],
                  })
                }
              >
                {PRACTICE_APPOINTMENT_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={practiceCopy.schedulingDuration}
              error={fieldErrors.durationMinutes}
            >
              <select
                className={selectClass}
                value={String(formValues.durationMinutes)}
                onChange={(e) =>
                  updateForm({ durationMinutes: Number(e.target.value) })
                }
              >
                {PRACTICE_APPOINTMENT_DURATIONS.map((mins) => (
                  <option key={mins} value={mins}>
                    {mins} min
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={practiceCopy.schedulingDateTime} error={fieldErrors.startsAt}>
            <Input
              type="datetime-local"
              value={toDatetimeLocalValue(formValues.startsAt)}
              onChange={(e) =>
                updateForm({ startsAt: fromDatetimeLocalValue(e.target.value) })
              }
            />
          </Field>

          <Field
            label={
              isBlock ? practiceCopy.schedulingKindBlock : practiceCopy.schedulingReason
            }
            error={fieldErrors.reasonForVisit}
          >
            <Input
              value={formValues.reasonForVisit}
              onChange={(e) => updateForm({ reasonForVisit: e.target.value })}
            />
          </Field>

          <Field label={practiceCopy.schedulingStatus} error={fieldErrors.status}>
            <select
              className={selectClass}
              value={formValues.status}
              onChange={(e) =>
                updateForm({
                  status: e.target.value as PracticeAppointmentFormValues["status"],
                })
              }
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label={practiceCopy.schedulingNotes}>
            <textarea
              rows={2}
              className={cn(selectClass, "h-auto py-2")}
              value={formValues.notes}
              onChange={(e) => updateForm({ notes: e.target.value })}
            />
          </Field>

          {message ? (
            <p className="text-sm text-destructive" role="alert">
              {message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" variant="accent" disabled={pending}>
              {pending ? "Saving…" : practiceCopy.schedulingSave}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              className="text-destructive"
              onClick={() => {
                if (!window.confirm(practiceCopy.schedulingDeleteConfirm)) return;
                startTransition(async () => {
                  await onDelete();
                  onClose();
                });
              }}
            >
              Delete
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-ink">{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AppointmentSheet({
  open,
  appointment,
  registeredPatients,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  appointment: PracticeAppointment | null;
  registeredPatients: PracticePatient[];
  onClose: () => void;
  onSave: (next: PracticeAppointment) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !appointment || !mounted) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70] md:hidden" role="presentation">
        <button
          type="button"
          className="absolute inset-0 bg-navy/45 backdrop-blur-[1px]"
          aria-label="Close appointment sheet"
          onClick={onClose}
        />
        <div className="absolute inset-x-0 bottom-0 pb-[env(safe-area-inset-bottom)]">
          <AppointmentSheetPanel
            titleId={titleId}
            appointment={appointment}
            registeredPatients={registeredPatients}
            onClose={onClose}
            onSave={onSave}
            onDelete={onDelete}
          />
        </div>
      </div>

      <div
        className="fixed inset-0 z-50 hidden items-center justify-center bg-navy/45 p-4 md:flex"
        role="presentation"
        onClick={onClose}
      >
        <AppointmentSheetPanel
          titleId={titleId}
          appointment={appointment}
          registeredPatients={registeredPatients}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
        />
      </div>
    </>,
    document.body,
  );
}
