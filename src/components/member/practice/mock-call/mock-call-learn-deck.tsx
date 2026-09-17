"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MockCallLearnSlide } from "@/components/member/practice/mock-call/mock-call-learn-slide";
import { MockCallLearnSummary } from "@/components/member/practice/mock-call/mock-call-learn-summary";
import { Button } from "@/components/ui/button";
import { practiceCopy } from "@/content/site";
import { callFlowSteps } from "@/lib/practice/call-flow";
import { cn } from "@/lib/utils";

type Props = {
  onBackToHub: () => void;
  onGoPractice: () => void;
  /** Reset deck when re-entering from hub */
  resetKey?: number;
};

const SUMMARY_INDEX = callFlowSteps.length;

export function MockCallLearnDeck({
  onBackToHub,
  onGoPractice,
  resetKey = 0,
}: Props) {
  const [slideIndex, setSlideIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const isSummary = slideIndex === SUMMARY_INDEX;
  const step = isSummary ? null : callFlowSteps[slideIndex];
  const isLastStep = slideIndex === callFlowSteps.length - 1;

  useEffect(() => {
    setSlideIndex(0);
  }, [resetKey]);

  const goPrev = useCallback(() => {
    setSlideIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setSlideIndex((i) => Math.min(SUMMARY_INDEX, i + 1));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight" && !isSummary) goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, isSummary]);

  const progressLabel = isSummary
    ? practiceCopy.mockCallLearnSummaryProgressLabel
    : practiceCopy.mockCallLearnSlideProgress
        .replace("{current}", String(slideIndex + 1))
        .replace("{total}", String(callFlowSteps.length));

  const progressTitle = isSummary
    ? practiceCopy.mockCallLearnSummaryTitle
    : step
      ? practiceCopy[step.titleKey]
      : "";

  return (
    <div className="space-y-4">
      <p
        className="rounded-lg bg-surface/80 px-3 py-2 text-xs font-medium text-navy"
        aria-live="polite"
      >
        {progressLabel}
        {progressTitle ? ` — ${progressTitle}` : ""}
      </p>

      <p className="text-sm text-muted">{practiceCopy.mockCallLearnIntro}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        {callFlowSteps.map((s, i) => (
          <span
            key={s.id}
            className={cn(
              "size-2.5 rounded-full transition-colors",
              i < slideIndex || isSummary
                ? "bg-teal-bright"
                : i === slideIndex
                  ? "bg-navy"
                  : "bg-border",
            )}
            aria-hidden
          />
        ))}
        <span
          className={cn(
            "ml-1 size-2.5 rounded-full ring-2 ring-offset-1 transition-colors",
            isSummary
              ? "bg-navy ring-navy/30"
              : "bg-border ring-transparent",
          )}
          aria-hidden
          title={practiceCopy.mockCallLearnSummaryProgressLabel}
        />
      </div>

      <div className="min-h-[280px] overflow-hidden rounded-xl border border-border bg-white p-4 sm:p-6">
        <AnimatePresence mode="wait" initial={false}>
          {isSummary ? (
            <motion.div
              key="summary"
              initial={reduceMotion ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
            >
              <MockCallLearnSummary />
            </motion.div>
          ) : step ? (
            <motion.div
              key={step.id}
              initial={reduceMotion ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
            >
              <MockCallLearnSlide step={step} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={slideIndex === 0}
          onClick={goPrev}
        >
          {practiceCopy.mockCallLearnPrev}
        </Button>
        {isSummary ? (
          <>
            <Button type="button" variant="secondary" onClick={onBackToHub}>
              {practiceCopy.mockCallLearnFinish}
            </Button>
            <Button type="button" variant="accent" onClick={onGoPractice}>
              {practiceCopy.mockCallLearnGoPractice}
            </Button>
          </>
        ) : isLastStep ? (
          <Button type="button" variant="accent" onClick={goNext}>
            {practiceCopy.mockCallLearnViewSummary}
          </Button>
        ) : (
          <Button type="button" variant="accent" onClick={goNext}>
            {practiceCopy.mockCallLearnNext}
          </Button>
        )}
      </div>
    </div>
  );
}
