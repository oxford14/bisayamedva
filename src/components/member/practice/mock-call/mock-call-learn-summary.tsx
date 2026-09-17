"use client";

import { MemberCard } from "@/components/member/ui";
import { practiceCopy } from "@/content/site";
import { callFlowSteps } from "@/lib/practice/call-flow";

export function MockCallLearnSummary() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-xl font-semibold text-ink">
          {practiceCopy.mockCallLearnSummaryTitle}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {practiceCopy.mockCallLearnSummaryLead}
        </p>
      </div>

      <MemberCard className="p-4">
        <ol className="space-y-2.5">
          {callFlowSteps.map((step) => (
            <li key={step.id} className="flex gap-3 text-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-bright/30 text-xs font-bold text-navy">
                {step.order}
              </span>
              <span className="pt-0.5 font-medium text-ink">
                {practiceCopy[step.titleKey]}
              </span>
            </li>
          ))}
        </ol>
      </MemberCard>

      <MemberCard className="border-l-4 border-l-navy/40 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/60">
          {practiceCopy.mockCallLearnExtraTipLabel}
        </p>
        <h4 className="mt-2 font-display text-base font-semibold text-ink">
          {practiceCopy.mockCallLearnExtraTipHoldTitle}
        </h4>
        <p className="mt-2 text-sm leading-relaxed text-ink">
          {practiceCopy.mockCallLearnExtraTipHoldBody}
        </p>
        <MemberCard className="mt-3 border-l-4 border-l-teal-bright p-3 shadow-none">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/60">
            {practiceCopy.mockCallLearnExampleLabel}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            &ldquo;{practiceCopy.mockCallLearnExtraTipHoldExample}&rdquo;
          </p>
        </MemberCard>
      </MemberCard>

      <p className="text-sm text-navy">{practiceCopy.mockCallLearnSummaryCta}</p>
    </div>
  );
}
