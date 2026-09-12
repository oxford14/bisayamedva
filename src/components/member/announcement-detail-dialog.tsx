"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open || !announcement) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-navy/45 overscroll-contain"
      role="presentation"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(calc(5.5rem+1rem),calc(env(safe-area-inset-bottom)+1rem))] sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="flex max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-6rem))] w-full max-w-lg flex-col rounded-2xl border border-border bg-white shadow-[0_24px_60px_rgba(47,56,38,0.18)] sm:max-h-[min(85vh,32rem)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="shrink-0 border-b border-border px-5 py-4">
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
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {announcement.body}
            </p>
          </div>
          <div className="shrink-0 border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4">
            <Button
              type="button"
              variant="accent"
              className="w-full sm:w-auto"
              onClick={onClose}
            >
              {inboxCopy.dialogClose}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
