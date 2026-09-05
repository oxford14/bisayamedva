"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { List } from "lucide-react";
import {
  deleteSession,
  restoreSession,
  upsertSession,
} from "@/app/(admin)/admin/actions";
import { StatusBadge } from "@/components/admin/ui";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SessionManagerCourse = {
  id: string;
  title: string;
};

export type SessionRosterStudent = {
  fullName: string;
  email: string;
  status: string;
};

export type SessionManagerRow = {
  id: string;
  course_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  format: string;
  capacity: number;
  meeting_url: string | null;
  status: string;
  courseTitle: string;
  enrolled: number;
};

type FormState = {
  id: string;
  course_id: string;
  title: string;
  starts_at: string;
  duration_minutes: string;
  capacity: string;
  meeting_url: string;
  status: string;
};

type SessionTab = "active" | "deleted";

const DEFAULT_DURATION_MINUTES = "120";

const emptyForm = (courseId: string): FormState => ({
  id: "",
  course_id: courseId,
  title: "NEXT WEEKEND TRAINING",
  starts_at: "",
  duration_minutes: DEFAULT_DURATION_MINUTES,
  capacity: "30",
  meeting_url: "",
  status: "DRAFT",
});

function toDatetimeLocal(iso: string, timeZone: string) {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function durationMinutesBetween(startsAt: string, endsAt: string) {
  const minutes = Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000,
  );
  return String(Math.max(minutes, 15));
}

function addMinutesToDatetimeLocal(value: string, minutes: number) {
  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  date.setMinutes(date.getMinutes() + minutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDurationLabel(minutes: number) {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  return `${minutes} min`;
}

function sessionToForm(session: SessionManagerRow): FormState {
  return {
    id: session.id,
    course_id: session.course_id,
    title: session.title,
    starts_at: toDatetimeLocal(session.starts_at, session.timezone),
    duration_minutes: durationMinutesBetween(session.starts_at, session.ends_at),
    capacity: String(session.capacity),
    meeting_url: session.meeting_url ?? "",
    status: session.status,
  };
}

export function SessionManager({
  sessions,
  courses,
  rosters = {},
}: {
  sessions: SessionManagerRow[];
  courses: SessionManagerCourse[];
  rosters?: Record<string, SessionRosterStudent[]>;
}) {
  const router = useRouter();
  const defaultCourseId = courses[0]?.id ?? "";
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultCourseId));
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [tab, setTab] = useState<SessionTab>("active");
  const [pending, startTransition] = useTransition();
  const [rosterSession, setRosterSession] = useState<SessionManagerRow | null>(
    null,
  );

  const editing = Boolean(form.id);
  const formTitle = editing ? "Edit session" : "Create session";

  const activeSessions = useMemo(
    () =>
      sessions
        .filter((session) => session.status !== "ARCHIVED")
        .sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        ),
    [sessions],
  );

  const deletedSessions = useMemo(
    () =>
      sessions
        .filter((session) => session.status === "ARCHIVED")
        .sort(
          (a, b) =>
            new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
        ),
    [sessions],
  );

  const visibleSessions = tab === "active" ? activeSessions : deletedSessions;

  function resetForm() {
    setForm(emptyForm(defaultCourseId));
    setFormError("");
    setFormSuccess("");
  }

  function startEdit(session: SessionManagerRow) {
    setForm(sessionToForm(session));
    setFormError("");
    setFormSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const duration = Number(form.duration_minutes);
    if (!Number.isFinite(duration) || duration < 15) {
      setFormError("Duration must be at least 15 minutes.");
      return;
    }

    const formData = new FormData();
    if (form.id) formData.set("id", form.id);
    formData.set("course_id", form.course_id);
    formData.set("title", form.title);
    formData.set("starts_at", form.starts_at);
    formData.set("ends_at", addMinutesToDatetimeLocal(form.starts_at, duration));
    formData.set("timezone", "Asia/Manila");
    formData.set("format", "Online");
    formData.set("capacity", form.capacity);
    formData.set("meeting_url", form.meeting_url);
    formData.set("status", form.status);

    startTransition(async () => {
      const result = await upsertSession(formData);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setFormSuccess(editing ? "Session updated." : "Session created.");
      if (!editing) resetForm();
      if (form.status === "ARCHIVED") setTab("deleted");
      else setTab("active");
      router.refresh();
    });
  }

  function removeSession(session: SessionManagerRow) {
    const hasSeats = session.enrolled > 0;
    const confirmed = window.confirm(
      hasSeats
        ? `This schedule has ${session.enrolled} enrolled student(s).\n\nRefund paid seats to their wallets, cancel enrollments, then move "${session.title}" to Deleted?\n\n(Cash PayMongo refund is not sent — store credit only.)`
        : `Move "${session.title}" to Deleted? You can restore it later.`,
    );
    if (!confirmed) return;

    setFormError("");
    setFormSuccess("");
    const formData = new FormData();
    formData.set("id", session.id);
    if (hasSeats) formData.set("confirm_refund", "1");

    startTransition(async () => {
      const result = await deleteSession(formData);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      if (form.id === session.id) resetForm();
      const refunded =
        "refundedCount" in result ? Number(result.refundedCount ?? 0) : 0;
      setFormSuccess(
        hasSeats
          ? `Schedule archived. ${refunded} wallet refund credit(s) applied.`
          : "Session moved to Deleted.",
      );
      setTab("deleted");
      router.refresh();
    });
  }

  function recoverSession(session: SessionManagerRow) {
    setFormError("");
    setFormSuccess("");
    const formData = new FormData();
    formData.set("id", session.id);

    startTransition(async () => {
      const result = await restoreSession(formData);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setFormSuccess("Session restored as DRAFT.");
      setTab("active");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-ink">{formTitle}</h2>
            <p className="mt-1 text-sm text-muted">
              {editing
                ? "Update schedule, capacity, meeting link, or status."
                : "Session ID is generated automatically when you save."}
            </p>
          </div>
          {editing ? (
            <Button type="button" variant="secondary" size="sm" onClick={resetForm}>
              Cancel edit
            </Button>
          ) : null}
        </div>

        <form className="mt-4 space-y-3" onSubmit={submitForm}>
          {editing ? <input type="hidden" name="id" value={form.id} /> : null}
          <Field label="Course" htmlFor="course_id">
            <select
              id="course_id"
              name="course_id"
              required
              className="flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5"
              value={form.course_id}
              onChange={(e) => updateField("course_id", e.target.value)}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Title" htmlFor="title">
            <Input
              id="title"
              name="title"
              required
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Starts at" htmlFor="starts_at">
              <Input
                id="starts_at"
                name="starts_at"
                type="datetime-local"
                required
                value={form.starts_at}
                onChange={(e) => updateField("starts_at", e.target.value)}
              />
            </Field>
            <Field
              label="Duration"
              htmlFor="duration_minutes"
              hint="Minutes (e.g. 120 = 2 hours)."
            >
              <Input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                min="15"
                step="15"
                required
                value={form.duration_minutes}
                onChange={(e) => updateField("duration_minutes", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Capacity" htmlFor="capacity">
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                required
                value={form.capacity}
                onChange={(e) => updateField("capacity", e.target.value)}
              />
            </Field>
            <Field label="Status" htmlFor="status">
              <select
                id="status"
                name="status"
                className="flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5"
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </Field>
          </div>
          <Field
            label="Meeting URL"
            htmlFor="meeting_url"
            hint="Optional. Add the Zoom or Meet link when ready."
          >
            <Input
              id="meeting_url"
              name="meeting_url"
              type="text"
              inputMode="url"
              placeholder="https://…"
              autoComplete="off"
              value={form.meeting_url}
              onChange={(e) => updateField("meeting_url", e.target.value)}
            />
          </Field>

          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          {formSuccess ? (
            <p className="text-sm text-navy" role="status">
              {formSuccess}
            </p>
          ) : null}

          <Button type="submit" variant="accent" disabled={pending || !defaultCourseId}>
            {pending ? "Saving…" : editing ? "Update session" : "Create session"}
          </Button>
        </form>
      </div>

      <div className="space-y-3">
        <div
          className="inline-flex rounded-[10px] border border-border bg-cream/70 p-1"
          role="tablist"
          aria-label="Session lists"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "active"}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-medium transition",
              tab === "active"
                ? "bg-white text-ink shadow-sm"
                : "text-muted hover:text-ink",
            )}
            onClick={() => setTab("active")}
          >
            Active ({activeSessions.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "deleted"}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-medium transition",
              tab === "deleted"
                ? "bg-white text-ink shadow-sm"
                : "text-muted hover:text-ink",
            )}
            onClick={() => setTab("deleted")}
          >
            Deleted ({deletedSessions.length})
          </button>
        </div>

        {visibleSessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-cream/60 px-6 py-12 text-center">
            <p className="font-semibold text-ink">
              {tab === "active" ? "No sessions yet" : "No deleted sessions"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {tab === "active"
                ? "Create a published session so students can enroll."
                : "Deleted schedules will show here so you can restore them."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-cream/80 text-[11px] tracking-[0.12em] text-navy/55 uppercase">
                  <tr>
                    {[
                      "Session",
                      "Course",
                      "Schedule",
                      "Capacity",
                      "Status",
                      "Actions",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 font-semibold whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {visibleSessions.map((session) => (
                    <tr
                      key={session.id}
                      className={
                        form.id === session.id ? "bg-teal-bright/10" : undefined
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{session.title}</div>
                        <div className="text-xs text-muted">{session.format}</div>
                      </td>
                      <td className="px-4 py-3">{session.courseTitle}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        {new Date(session.starts_at).toLocaleString("en-PH", {
                          timeZone: session.timezone,
                        })}
                      </div>
                      <div className="text-xs text-muted">
                        {formatDurationLabel(
                          Math.round(
                            (new Date(session.ends_at).getTime() -
                              new Date(session.starts_at).getTime()) /
                              60_000,
                          ),
                        )}
                      </div>
                    </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>
                            {session.enrolled}/{session.capacity}
                          </span>
                          {session.enrolled > 0 ? (
                            <button
                              type="button"
                              className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-navy/70 transition hover:bg-cream hover:text-navy"
                              aria-label={`View ${session.enrolled} enrolled students`}
                              onClick={() => setRosterSession(session)}
                            >
                              <List className="size-4" aria-hidden />
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={session.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {tab === "active" ? (
                            <>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => startEdit(session)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={pending}
                                onClick={() => removeSession(session)}
                              >
                                Delete
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={pending}
                              onClick={() => recoverSession(session)}
                            >
                              Restore
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {rosterSession ? (
        <SessionRosterSheet
          session={rosterSession}
          students={rosters[rosterSession.id] ?? []}
          onClose={() => setRosterSession(null)}
        />
      ) : null}
    </div>
  );
}

function SessionRosterSheet({
  session,
  students,
  onClose,
}: {
  session: SessionManagerRow;
  students: SessionRosterStudent[];
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-white shadow-[0_24px_60px_rgba(47,56,38,0.18)] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border px-5 py-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
            Enrolled students
          </p>
          <h2
            id={titleId}
            className="mt-1 font-display text-xl font-semibold text-ink"
          >
            {session.title}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {session.courseTitle} · {students.length} seat
            {students.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {students.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              No enrolled students.
            </p>
          ) : (
            <ul className="divide-y divide-border/70">
              {students.map((student, index) => (
                <li
                  key={`${student.email}-${index}`}
                  className="flex flex-wrap items-start justify-between gap-2 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {student.fullName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {student.email}
                    </p>
                  </div>
                  <StatusBadge status={student.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border px-5 py-4">
          <Button type="button" variant="secondary" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
