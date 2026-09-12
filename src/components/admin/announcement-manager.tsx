"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { X } from "lucide-react";
import {
  searchStudentsForAnnouncement,
  upsertMemberAnnouncement,
} from "@/app/(admin)/admin/actions";
import { StatusBadge } from "@/components/admin/ui";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeAnnouncementBody } from "@/lib/member/announcement-body";
import type { AnnouncementAudienceType } from "@/lib/member/announcements";
import { cn } from "@/lib/utils";

export type AnnouncementSessionOption = {
  id: string;
  label: string;
};

export type AnnouncementManagerRow = {
  id: string;
  title: string;
  body: string;
  published: boolean;
  audience_type: AnnouncementAudienceType;
  send_email: boolean;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
  recipient_count?: number;
  session_count?: number;
};

type SelectedStudent = {
  id: string;
  full_name: string;
  email: string;
};

type FormState = {
  id: string;
  title: string;
  body: string;
  published: boolean;
  audienceType: AnnouncementAudienceType;
  sessionIds: string[];
  selectedStudents: SelectedStudent[];
  sendEmail: boolean;
  wasPublished: boolean;
};

const emptyForm = (): FormState => ({
  id: "",
  title: "",
  body: "",
  published: true,
  audienceType: "ALL",
  sessionIds: [],
  selectedStudents: [],
  sendEmail: false,
  wasPublished: false,
});

function rowToForm(row: AnnouncementManagerRow): FormState {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    published: row.published,
    audienceType: row.audience_type,
    sessionIds: [],
    selectedStudents: [],
    sendEmail: row.send_email,
    wasPublished: row.published,
  };
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function audienceSummary(row: AnnouncementManagerRow) {
  const count = row.recipient_count ?? 0;
  switch (row.audience_type) {
    case "ALL":
      return `All active members · ${count} students`;
    case "SESSION":
      return `${row.session_count ?? 0} session(s) · ${count} students`;
    case "INDIVIDUAL":
      return `${count} student(s)`;
    default:
      return `${count} students`;
  }
}

const previewBodyClass =
  "whitespace-pre-wrap text-sm leading-relaxed text-ink min-h-[8rem] rounded-xl border border-border bg-cream/50 p-4";

export function AnnouncementManager({
  announcements,
  sessions,
}: {
  announcements: AnnouncementManagerRow[];
  sessions: AnnouncementSessionOption[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(announcements);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, start] = useTransition();
  const [studentQuery, setStudentQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SelectedStudent[]>([]);
  const [searching, setSearching] = useState(false);

  const previewBody = normalizeAnnouncementBody(form.body);
  const audienceLocked = form.wasPublished;

  useEffect(() => {
    setRows(announcements);
  }, [announcements]);

  useEffect(() => {
    const term = studentQuery.trim();
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    const handle = window.setTimeout(() => {
      setSearching(true);
      void searchStudentsForAnnouncement(term).then((result) => {
        setSearching(false);
        if (result.ok) setSearchResults(result.students);
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [studentQuery]);

  const selectedStudentIds = useMemo(
    () => new Set(form.selectedStudents.map((s) => s.id)),
    [form.selectedStudents],
  );

  function reset() {
    setForm(emptyForm());
    setError("");
    setInfo("");
    setStudentQuery("");
    setSearchResults([]);
  }

  function edit(row: AnnouncementManagerRow) {
    setForm(rowToForm(row));
    setError("");
    setInfo("");
    setStudentQuery("");
    setSearchResults([]);
  }

  function toggleSession(sessionId: string) {
    setForm((f) => ({
      ...f,
      sessionIds: f.sessionIds.includes(sessionId)
        ? f.sessionIds.filter((id) => id !== sessionId)
        : [...f.sessionIds, sessionId],
    }));
  }

  function addStudent(student: SelectedStudent) {
    if (selectedStudentIds.has(student.id)) return;
    setForm((f) => ({
      ...f,
      selectedStudents: [...f.selectedStudents, student],
    }));
    setStudentQuery("");
    setSearchResults([]);
  }

  function removeStudent(id: string) {
    setForm((f) => ({
      ...f,
      selectedStudents: f.selectedStudents.filter((s) => s.id !== id),
    }));
  }

  function save() {
    setError("");
    setInfo("");
    start(async () => {
      const result = await upsertMemberAnnouncement({
        id: form.id || undefined,
        title: form.title,
        body: form.body,
        published: form.published,
        audienceType: form.audienceType,
        sessionIds: form.sessionIds,
        userIds: form.selectedStudents.map((s) => s.id),
        sendEmail: form.sendEmail,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.emailWarning) setInfo(result.emailWarning);

      const saved = result.announcement;
      const mapped: AnnouncementManagerRow = {
        id: saved.id,
        title: saved.title,
        body: saved.body,
        published: saved.published,
        audience_type: saved.audience_type,
        send_email: saved.send_email,
        email_sent_at: saved.email_sent_at,
        created_at: saved.created_at,
        updated_at: saved.updated_at,
        recipient_count: saved.recipient_count,
        session_count:
          saved.audience_type === "SESSION" ? form.sessionIds.length : 0,
      };
      setRows((prev) => {
        const idx = prev.findIndex((r) => r.id === mapped.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...mapped };
          return next;
        }
        return [mapped, ...prev];
      });
      setForm({
        ...rowToForm(mapped),
        sessionIds: form.sessionIds,
        selectedStudents: form.selectedStudents,
      });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
          {form.id ? "Edit announcement" : "New announcement"}
        </p>
        <div className="mt-4 space-y-4">
          <Field label="Title" htmlFor="ann-title">
            <Input
              id="ann-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Weekend class reminder"
              maxLength={200}
            />
          </Field>
          <Field
            label="Body"
            htmlFor="ann-body"
            hint="Paste your message here. Line breaks and blank lines stay the same for students."
          >
            <textarea
              id="ann-body"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={12}
              className="w-full resize-y rounded-xl border border-input bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Type or paste the full announcement…"
            />
          </Field>

          <div>
            <p className="text-sm font-medium text-ink">Audience</p>
            {audienceLocked ? (
              <p className="mt-1 text-xs text-muted">
                Audience is locked after publish. Create a new announcement to
                retarget.
              </p>
            ) : null}
            <fieldset
              className="mt-2 space-y-2"
              disabled={audienceLocked}
              aria-label="Announcement audience"
            >
              {(
                [
                  ["ALL", "All active members (ACTIVE or COMPLETED enrollment)"],
                  ["SESSION", "Specific weekend session(s)"],
                  ["INDIVIDUAL", "Individual students"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 text-sm",
                    form.audienceType === value
                      ? "border-navy/30 bg-cream"
                      : "border-border",
                    audienceLocked && "opacity-70",
                  )}
                >
                  <input
                    type="radio"
                    name="audience"
                    checked={form.audienceType === value}
                    onChange={() =>
                      setForm((f) => ({ ...f, audienceType: value }))
                    }
                    className="mt-0.5 size-4 accent-[var(--color-teal,#5b6d49)]"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
          </div>

          {!audienceLocked && form.audienceType === "SESSION" ? (
            <Field label="Sessions" htmlFor="ann-sessions" hint="Select one or more class sessions.">
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
                {sessions.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted">No sessions found.</p>
                ) : (
                  sessions.map((session) => (
                    <label
                      key={session.id}
                      className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 hover:bg-sand"
                    >
                      <input
                        type="checkbox"
                        checked={form.sessionIds.includes(session.id)}
                        onChange={() => toggleSession(session.id)}
                        className="mt-0.5 size-4 accent-[var(--color-teal,#5b6d49)]"
                      />
                      <span className="text-sm text-ink">{session.label}</span>
                    </label>
                  ))
                )}
              </div>
            </Field>
          ) : null}

          {!audienceLocked && form.audienceType === "INDIVIDUAL" ? (
            <Field label="Students" htmlFor="ann-students" hint="Search by name or email (min 2 characters).">
              <Input
                id="ann-students"
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                placeholder="Search students…"
              />
              {searching ? (
                <p className="mt-2 text-xs text-muted">Searching…</p>
              ) : null}
              {searchResults.length > 0 ? (
                <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-border">
                  {searchResults.map((student) => (
                    <li key={student.id}>
                      <button
                        type="button"
                        onClick={() => addStudent(student)}
                        disabled={selectedStudentIds.has(student.id)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-sand disabled:opacity-50"
                      >
                        <span className="font-medium text-ink">
                          {student.full_name || student.email}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {student.email}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {form.selectedStudents.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {form.selectedStudents.map((student) => (
                    <li
                      key={student.id}
                      className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-navy"
                    >
                      {student.full_name || student.email}
                      <button
                        type="button"
                        onClick={() => removeStudent(student.id)}
                        className="rounded-full p-0.5 hover:bg-white"
                        aria-label={`Remove ${student.full_name}`}
                      >
                        <X className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Field>
          ) : null}

          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.sendEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, sendEmail: e.target.checked }))
              }
              disabled={Boolean(form.id && form.wasPublished && rows.find((r) => r.id === form.id)?.email_sent_at)}
              className="size-4 accent-[var(--color-teal,#5b6d49)]"
            />
            Also send to their email
          </label>
          {form.id && rows.find((r) => r.id === form.id)?.email_sent_at ? (
            <p className="text-xs text-muted">
              Email already sent for this announcement.
            </p>
          ) : null}

          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) =>
                setForm((f) => ({ ...f, published: e.target.checked }))
              }
              className="size-4 accent-[var(--color-teal,#5b6d49)]"
            />
            Published (bell + home for selected audience)
          </label>

          {error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : null}
          {info ? (
            <p className="text-sm font-medium text-navy/80">{info}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="accent"
              disabled={pending || !form.title.trim() || !form.body.trim()}
              onClick={save}
            >
              {pending ? "Saving…" : form.id ? "Save changes" : "Publish"}
            </Button>
            {form.id ? (
              <Button type="button" variant="secondary" onClick={reset}>
                New announcement
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
            Student preview
          </p>
          <div className="mt-3">
            {form.title.trim() ? (
              <p className="mb-2 font-display text-lg font-semibold text-ink">
                {form.title.trim()}
              </p>
            ) : null}
            <div className={previewBodyClass}>
              {previewBody.trim() ? previewBody : (
                <span className="text-muted">Body preview</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
          All announcements
        </p>
        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No announcements yet.</p>
        ) : (
          <ul className="mt-4 max-h-[36rem] space-y-2 overflow-y-auto">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => edit(row)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-3 text-left transition-colors hover:bg-sand",
                    form.id === row.id
                      ? "border-navy/30 bg-cream"
                      : "border-border bg-white",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-ink">{row.title}</p>
                    <StatusBadge
                      status={row.published ? "PUBLISHED" : "DRAFT"}
                    />
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-teal">
                    {audienceSummary(row)}
                  </p>
                  {row.email_sent_at ? (
                    <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-navy/60 uppercase">
                      Email sent
                    </p>
                  ) : row.send_email && row.published ? (
                    <p className="mt-0.5 text-[10px] text-muted">
                      Email pending / not sent
                    </p>
                  ) : null}
                  <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-muted">
                    {row.body}
                  </p>
                  <p className="mt-2 text-[10px] text-muted">
                    {formatWhen(row.updated_at)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
