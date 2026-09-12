"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { upsertMemberAnnouncement } from "@/app/(admin)/admin/actions";
import { StatusBadge } from "@/components/admin/ui";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeAnnouncementBody } from "@/lib/member/announcement-body";
import { cn } from "@/lib/utils";

export type AnnouncementManagerRow = {
  id: string;
  title: string;
  body: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

type FormState = {
  id: string;
  title: string;
  body: string;
  published: boolean;
};

const emptyForm = (): FormState => ({
  id: "",
  title: "",
  body: "",
  published: true,
});

function rowToForm(row: AnnouncementManagerRow): FormState {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    published: row.published,
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

const previewBodyClass =
  "whitespace-pre-wrap text-sm leading-relaxed text-ink min-h-[8rem] rounded-xl border border-border bg-cream/50 p-4";

export function AnnouncementManager({
  announcements,
}: {
  announcements: AnnouncementManagerRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(announcements);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const previewBody = normalizeAnnouncementBody(form.body);

  function reset() {
    setForm(emptyForm());
    setError("");
  }

  function edit(row: AnnouncementManagerRow) {
    setForm(rowToForm(row));
    setError("");
  }

  function save() {
    setError("");
    start(async () => {
      const result = await upsertMemberAnnouncement({
        id: form.id || undefined,
        title: form.title,
        body: form.body,
        published: form.published,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const saved = result.announcement;
      const mapped: AnnouncementManagerRow = {
        id: saved.id,
        title: saved.title,
        body: saved.body,
        published: saved.published,
        created_at: saved.created_at,
        updated_at: saved.updated_at,
      };
      setRows((prev) => {
        const idx = prev.findIndex((r) => r.id === mapped.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = mapped;
          return next;
        }
        return [mapped, ...prev];
      });
      setForm(rowToForm(mapped));
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
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) =>
                setForm((f) => ({ ...f, published: e.target.checked }))
              }
              className="size-4 accent-[var(--color-teal,#5b6d49)]"
            />
            Published (visible to students)
          </label>
          {error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
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
          <p className="mt-1 text-xs text-muted">
            Same formatting students see in the bell and announcement dialog.
          </p>
          <div className="mt-3">
            {form.title.trim() ? (
              <p className="mb-2 font-display text-lg font-semibold text-ink">
                {form.title.trim()}
              </p>
            ) : (
              <p className="mb-2 text-sm text-muted">Title preview</p>
            )}
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
