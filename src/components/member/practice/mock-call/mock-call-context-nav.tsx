"use client";

import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { practiceCopy } from "@/content/site";
import { cn } from "@/lib/utils";

export type MockCallNavPhase =
  | "welcome"
  | "hub"
  | "learn"
  | "practice"
  | "audioSetup";

const phaseLabel: Record<MockCallNavPhase, string> = {
  welcome: practiceCopy.mockCallNavPhaseWelcome,
  hub: practiceCopy.mockCallNavPhaseHub,
  learn: practiceCopy.mockCallTabLearn,
  practice: practiceCopy.mockCallTabPractice,
  audioSetup: practiceCopy.mockCallNavPhaseAudioSetup,
};

type Props = {
  phase: MockCallNavPhase;
  onBackToHub?: () => void;
  className?: string;
};

export function MockCallContextNav({ phase, onBackToHub, className }: Props) {
  const showHub =
    (phase === "learn" || phase === "practice" || phase === "audioSetup") &&
    onBackToHub;

  return (
    <nav
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-white/90 px-3 py-2.5 shadow-sm",
        className,
      )}
      aria-label="Mock Call navigation"
    >
      <ol className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm">
        <li>
          <Link
            href="/member/practice"
            className="font-medium text-muted transition-colors hover:text-navy"
          >
            {practiceCopy.hubTitle}
          </Link>
        </li>
        <li className="text-muted/50" aria-hidden>
          /
        </li>
        <li className="font-medium text-ink">{practiceCopy.mockCallTitle}</li>
        <li className="text-muted/50" aria-hidden>
          /
        </li>
        <li className="truncate font-medium text-navy">{phaseLabel[phase]}</li>
      </ol>

      {showHub ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={onBackToHub}
        >
          <LayoutGrid className="size-3.5" aria-hidden />
          {practiceCopy.mockCallBackToHubShort}
        </Button>
      ) : null}
    </nav>
  );
}
