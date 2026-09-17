"use client";

import { Phone } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { practiceCopy } from "@/content/site";
import { useIncomingCallRing } from "@/lib/practice/mock-call/use-incoming-call-ring";
import { cn } from "@/lib/utils";

type Props = {
  scenarioTitle: string;
  moodLabel: string;
  onAnswer: () => void;
};

export function MockCallIncomingCall({
  scenarioTitle,
  moodLabel,
  onAnswer,
}: Props) {
  const reduceMotion = useReducedMotion();
  useIncomingCallRing(!reduceMotion);

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="relative flex size-28 items-center justify-center">
        {!reduceMotion ? (
          <>
            <motion.span
              className="absolute inset-0 rounded-full bg-teal-bright/25"
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
            <motion.span
              className="absolute inset-2 rounded-full bg-teal-bright/20"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.15, 0.5] }}
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
        <span className="relative flex size-20 items-center justify-center rounded-full bg-navy text-white shadow-lg">
          <Phone
            className={cn("size-9", !reduceMotion && "animate-pulse")}
            aria-hidden
          />
        </span>
      </div>

      <p className="mt-6 text-[11px] font-semibold uppercase tracking-wide text-navy/60">
        {practiceCopy.mockCallIncomingTitle}
      </p>
      <p className="mt-2 font-display text-xl font-semibold text-ink">
        {scenarioTitle}
      </p>
      <span className="mt-2 inline-flex rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold text-navy/80">
        {moodLabel}
      </span>
      <p className="mt-4 max-w-sm text-sm text-muted">
        {practiceCopy.mockCallIncomingSubtitle}
      </p>

      <Button
        type="button"
        variant="accent"
        size="lg"
        className="mt-8 min-w-[200px]"
        onClick={onAnswer}
      >
        {practiceCopy.mockCallAnswerCall}
      </Button>
    </div>
  );
}
