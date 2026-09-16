"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { PracticeDisclaimer } from "@/components/member/practice/practice-disclaimer";
import { Button } from "@/components/ui/button";
import { practiceCopy } from "@/content/site";
import { resetPracticeStore } from "@/lib/practice/db";
import { practiceSimTiles } from "@/lib/practice/hub-sims";

function PracticeSimTile({
  href,
  title,
  description,
  icon: Icon,
}: (typeof practiceSimTiles)[number]) {
  return (
    <Link
      href={href}
      className="group flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-white p-4 text-center shadow-[0_8px_24px_rgba(47,56,38,0.04)] transition-[box-shadow,border-color,transform] hover:border-navy/15 hover:shadow-[0_12px_28px_rgba(47,56,38,0.08)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
    >
      <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-teal-bright/25 text-navy transition-colors group-hover:bg-teal-bright/35">
        <Icon className="size-7" aria-hidden />
      </span>
      <div className="min-w-0 w-full px-1">
        <p className="font-display text-sm font-semibold leading-snug text-ink sm:text-base">
          {title}
        </p>
        <p className="mt-1.5 line-clamp-3 text-[11px] leading-snug text-muted sm:text-xs">
          {description}
        </p>
      </div>
    </Link>
  );
}

export function PracticeHubClient({ ownerUserId }: { ownerUserId: string }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function onReset() {
    if (!window.confirm(practiceCopy.resetConfirm)) return;
    startTransition(async () => {
      await resetPracticeStore(ownerUserId);
      setMessage("Practice data reset. Demo patients and appointments are back.");
    });
  }

  return (
    <div className="space-y-6">
      <PracticeDisclaimer />

      <div>
        <h2 className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
          {practiceCopy.hubSimulationsLabel}
        </h2>
        <div className="grid max-w-2xl grid-cols-2 gap-3 sm:max-w-3xl sm:grid-cols-3 sm:gap-4">
          {practiceSimTiles.map((sim) => (
            <PracticeSimTile key={sim.href} {...sim} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">{practiceCopy.storageNote}</p>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={onReset}
        >
          {pending ? "Resetting…" : practiceCopy.resetData}
        </Button>
      </div>

      {message ? (
        <p className="text-sm text-navy" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
