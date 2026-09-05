"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatPeso } from "@/lib/utils";
import type { OpenFutureSession } from "@/lib/member/open-sessions-shared";
import {
  courseCheckoutWithSession,
  formatOpenSessionWhen,
} from "@/lib/member/open-sessions-shared";

type EnrollScheduleModalProps = {
  open: boolean;
  courseTitle: string;
  courseSlug: string;
  coursePrice: number;
  sessions: OpenFutureSession[];
  onClose: () => void;
};

export function EnrollScheduleModal({
  open,
  courseTitle,
  courseSlug,
  coursePrice,
  sessions,
  onClose,
}: EnrollScheduleModalProps) {
  const titleId = useId();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setSelectedId(sessions[0]?.id ?? "");
  }, [open, sessions]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const hasSessions = sessions.length > 0;

  function confirm() {
    if (!selectedId) return;
    router.push(courseCheckoutWithSession(courseSlug, selectedId));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-[0_24px_60px_rgba(47,56,38,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
          Enroll
        </p>
        <h2
          id={titleId}
          className="mt-1 font-display text-2xl font-semibold text-ink"
        >
          {courseTitle}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Pilia ang open weekend schedule para sa imong seat ·{" "}
          {formatPeso(coursePrice)}
        </p>

        {hasSessions ? (
          <fieldset className="mt-5 space-y-2">
            <legend className="sr-only">Open schedules</legend>
            {sessions.map((session) => {
              const checked = selectedId === session.id;
              return (
                <label
                  key={session.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
                    checked
                      ? "border-teal bg-teal-bright/15"
                      : "border-border bg-cream/40 hover:border-navy/25"
                  }`}
                >
                  <input
                    type="radio"
                    name="enroll-session"
                    value={session.id}
                    checked={checked}
                    onChange={() => setSelectedId(session.id)}
                    className="mt-1 size-4 accent-[var(--color-teal,#5b6d49)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">
                      {session.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {formatOpenSessionWhen(session)}
                      {session.format ? ` · ${session.format}` : ""}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-border bg-cream/70 px-4 py-8 text-center">
            <p className="font-semibold text-ink">No schedule available yet.</p>
            <p className="mt-2 text-sm text-muted">
              Wala pa’y open weekend date for this course. Check Schedule later
              when admin opens one.
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="accent"
            disabled={!hasSessions || !selectedId}
            onClick={confirm}
          >
            Continue to enroll
          </Button>
        </div>
      </div>
    </div>
  );
}
