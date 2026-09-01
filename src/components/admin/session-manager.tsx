"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { deleteSession, upsertSession } from "@/app/(admin)/admin/actions";
import { StatusBadge } from "@/components/admin/ui";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SessionManagerCourse = {
  id: string;
  title: string;
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
  ends_at: string;
  capacity: string;
  meeting_url: string;
  status: string;
};

const emptyForm = (courseId: string): FormState => ({
  id: "",
  course_id: courseId,
  title: "NEXT WEEKEND TRAINING",
  starts_at: "",
  ends_at: "",
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

function sessionToForm(session: SessionManagerRow): FormState {
  return {
    id: session.id,
    course_id: session.course_id,
    title: session.title,
    starts_at: toDatetimeLocal(session.starts_at, session.timezone),
    ends_at: toDatetimeLocal(session.ends_at, session.timezone),
    capacity: String(session.capacity),
    meeting_url: session.meeting_url ?? "",
    status: session.status,
  };
}

export function SessionManager({
  sessions,
  courses,
}: {
  sessions: SessionManagerRow[];
  courses: SessionManagerCourse[];
}) {
  const router = useRouter();
  const defaultCourseId = courses[0]?.id ?? "";
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultCourseId));
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  const editing = Boolean(form.id);
  const formTitle = editing ? "Edit session" : "Create session";

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      ),
    [sessions],
  );

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

    const formData = new FormData();
    if (form.id) formData.set("id", form.id);
    formData.set("course_id", form.course_id);
    formData.set("title", form.title);
    formData.set("starts_at", form.starts_at);
    formData.set("ends_at", form.ends_at);
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
      router.refresh();
    });
  }

  function removeSession(session: SessionManagerRow) {
    const confirmed = window.confirm(
      `Delete "${session.title}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setFormError("");
    setFormSuccess("");
    const formData = new FormData();
    formData.set("id", session.id);

    startTransition(async () => {
      const result = await deleteSession(formData);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      if (form.id === session.id) resetForm();
      setFormSuccess("Session deleted.");
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
            <Field label="Ends at" htmlFor="ends_at">
              <Input
                id="ends_at"
                name="ends_at"
                type="datetime-local"
                required
                value={form.ends_at}
                onChange={(e) => updateField("ends_at", e.target.value)}
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

      {sortedSessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-cream/60 px-6 py-12 text-center">
          <p className="font-semibold text-ink">No sessions yet</p>
          <p className="mt-2 text-sm text-muted">
            Create a published session so students can enroll.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-cream/80 text-[11px] tracking-[0.12em] text-navy/55 uppercase">
                <tr>
                  {["Session", "Course", "Schedule", "Capacity", "Status", "Actions"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-4 py-3 font-semibold whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {sortedSessions.map((session) => (
                  <tr
                    key={session.id}
                    className={form.id === session.id ? "bg-teal-bright/10" : undefined}
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
                        to{" "}
                        {new Date(session.ends_at).toLocaleTimeString("en-PH", {
                          timeZone: session.timezone,
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {session.enrolled}/{session.capacity}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={session.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
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
  );
}
