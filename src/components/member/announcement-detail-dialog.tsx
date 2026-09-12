"use client";

import { useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import { inboxCopy } from "@/content/site";

export type AnnouncementDetail = {
  title: string;
  body: string;
  created_at: string;
};

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
    return "";
  }
}

export function AnnouncementDetailDialog({
  open,
  onClose,
  announcement,
}: {
  open: boolean;
  onClose: () => void;
  announcement: AnnouncementDetail | null;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !announcement) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-navy/45 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(85vh,32rem)] w-full max-w-lg flex-col rounded-2xl border border-border bg-white shadow-[0_24px_60px_rgba(47,56,38,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border px-5 py-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
            {inboxCopy.announcementLabel}
          </p>
          <h2
            id={titleId}
            className="mt-1 font-display text-xl font-semibold text-ink"
          >
            {announcement.title}
          </h2>
          <p className="mt-1 text-xs text-muted">
            {formatWhen(announcement.created_at)}
          </p>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {announcement.body}
          </p>
        </div>
        <div className="border-t border-border px-5 py-4">
          <Button type="button" variant="accent" className="w-full sm:w-auto" onClick={onClose}>
            {inboxCopy.dialogClose}
          </Button>
        </div>
      </div>
    </div>
  );
}
