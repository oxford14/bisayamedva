"use client";

import { useEffect, useId, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scheduleCopy } from "@/content/site";
import { cn } from "@/lib/utils";

type MeetingOpenLinkProps = {
  href: string;
  className?: string;
};

export function MeetingOpenLink({ href, className }: MeetingOpenLinkProps) {
  const titleId = useId();
  const bodyId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function confirmOpen() {
    setOpen(false);
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 font-medium text-teal hover:text-navy",
          className,
        )}
      >
        {scheduleCopy.meetingOpenLink}
        <ExternalLink className="size-3.5" aria-hidden />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 p-4 sm:items-center"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={bodyId}
            className="w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-[0_24px_60px_rgba(47,56,38,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <p
              id={titleId}
              className="font-display text-xl font-semibold text-ink"
            >
              {scheduleCopy.meetingOpenDialogTitle}
            </p>
            <p id={bodyId} className="mt-3 text-sm leading-relaxed text-muted">
              {scheduleCopy.meetingOpenDialogBody}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                {scheduleCopy.meetingOpenCancel}
              </Button>
              <Button type="button" variant="accent" onClick={confirmOpen}>
                {scheduleCopy.meetingOpenConfirm}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
