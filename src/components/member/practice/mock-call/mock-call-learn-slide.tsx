"use client";

import { MemberCard } from "@/components/member/ui";
import { practiceCopy } from "@/content/site";
import type { CallFlowStep } from "@/lib/practice/call-flow";

export function MockCallLearnSlide({ step }: { step: CallFlowStep }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-navy font-display text-lg font-semibold text-white">
          {step.order}
        </span>
        <div>
          <h3 className="font-display text-xl font-semibold text-ink">
            {practiceCopy[step.titleKey]}
          </h3>
        </div>
      </div>

      <MemberCard className="border-l-4 border-l-navy/40 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/60">
          {practiceCopy.mockCallLearnVaLabel}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink">
          {practiceCopy[step.vaFocusKey]}
        </p>
      </MemberCard>

      <MemberCard className="border-l-4 border-l-teal-bright p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/60">
          {practiceCopy.mockCallLearnExampleLabel}
        </p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">
          {practiceCopy[step.exampleVaKey]}
        </p>
      </MemberCard>

      <div className="rounded-lg bg-sand/40 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/60">
          {practiceCopy.mockCallLearnCallerLabel}
        </p>
        <p className="mt-1 text-sm text-muted">
          {practiceCopy[step.callerBehaviorKey]}
        </p>
      </div>
    </div>
  );
}
