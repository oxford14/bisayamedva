"use client";

import { Phone } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { practiceCopy } from "@/content/site";
import { useMockCallTimer } from "@/lib/practice/mock-call/use-mock-call-timer";
import { cn } from "@/lib/utils";

type Props = {
  callerName: string;
  moodLabel?: string;
  startedAt: string;
  onEndCall: () => void;
  disabled?: boolean;
};

export function MockCallInCallHeader({
  callerName,
  moodLabel,
  startedAt,
  onEndCall,
  disabled,
}: Props) {
  const reduceMotion = useReducedMotion();
  const elapsed = useMockCallTimer(startedAt);

  return (
    <div
      className="border-b border-border pb-3"
      role="region"
      aria-label={practiceCopy.mockCallInCallLabel}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex size-12 shrink-0 items-center justify-center">
            {!reduceMotion ? (
              <>
                <motion.span
                  className="absolute inset-0 rounded-full bg-teal-bright/25"
                  animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  aria-hidden
                />
                <motion.span
                  className="absolute inset-1 rounded-full bg-teal-bright/20"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.45, 0.12, 0.45] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.25,
                  }}
                  aria-hidden
                />
              </>
            ) : null}
            <span className="relative flex size-9 items-center justify-center rounded-full bg-navy text-white shadow-md">
              <Phone
                className={cn("size-4", !reduceMotion && "animate-pulse")}
                aria-hidden
              />
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span
                className="font-mono text-sm font-semibold tabular-nums text-navy"
                aria-live="polite"
              >
                {elapsed}
              </span>
              <span className="truncate font-display text-base font-semibold text-ink">
                {callerName}
              </span>
            </div>
            {moodLabel ? (
              <span className="mt-1 inline-flex rounded-full bg-sand px-2 py-0.5 text-[10px] font-semibold text-navy/80">
                {moodLabel}
              </span>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-destructive hover:text-destructive"
          disabled={disabled}
          onClick={onEndCall}
        >
          {practiceCopy.mockCallEndCall}
        </Button>
      </div>
    </div>
  );
}
