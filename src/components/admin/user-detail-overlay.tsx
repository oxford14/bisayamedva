"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId } from "react";
import { X } from "lucide-react";

export function UserDetailOverlay({
  title,
  description,
  closeHref,
  children,
}: {
  title: string;
  description?: string;
  closeHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const titleId = useId();

  function onClose() {
    router.push(closeHref, { scroll: false });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeHref]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-navy/45 p-0 sm:items-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col rounded-t-[1.35rem] border border-border bg-cream pb-[env(safe-area-inset-bottom)] shadow-[0_24px_60px_rgba(47,56,38,0.18)] sm:max-h-[90vh] sm:rounded-2xl sm:pb-0"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-navy/20" aria-hidden />
        </div>
        <div className="flex items-start justify-between gap-3 border-b border-border/80 px-5 pt-3 pb-4 sm:px-6 sm:pt-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 truncate text-sm text-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-navy/70 transition-colors hover:bg-white hover:text-navy"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
