"use client";

import { useCallback, useEffect, useState } from "react";
import type { MockCallToolState } from "@/lib/practice/mock-call/mock-call-tool-state";
import { ClaimStatusToolMini } from "@/components/member/practice/mock-call/tools/claim-status-tool-mini";
import { EligibilityToolMini } from "@/components/member/practice/mock-call/tools/eligibility-tool-mini";
import { InsurancePrimaryToolMini } from "@/components/member/practice/mock-call/tools/insurance-primary-tool-mini";
import { PatientAccountToolMini } from "@/components/member/practice/mock-call/tools/patient-account-tool-mini";
import { PriorAuthToolMini } from "@/components/member/practice/mock-call/tools/prior-auth-tool-mini";
import { ScheduleToolMini } from "@/components/member/practice/mock-call/tools/schedule-tool-mini";
import { practiceCopy } from "@/content/site";
import type { MockCallToolConfig } from "@/lib/practice/mock-call/tool-config";
import { cn } from "@/lib/utils";

export function MockCallToolPanel({
  config,
  onToolStateChange,
}: {
  config: MockCallToolConfig;
  onToolStateChange?: (state: MockCallToolState) => void;
}) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set());
  const [scheduleState, setScheduleState] = useState<MockCallToolState>({
    completedClickIds: [],
    selectedSlot: null,
    bookingSaved: false,
  });
  const [wrongHint, setWrongHint] = useState(false);

  const nextIndex = config.clicks.findIndex((c) => !completedIds.has(c.id));
  const nextClickId =
    nextIndex >= 0 ? config.clicks[nextIndex]?.id ?? null : null;
  const allDone = nextIndex < 0;

  const flashWrong = useCallback(() => {
    setWrongHint(true);
    window.setTimeout(() => setWrongHint(false), 1500);
  }, []);

  const onHotspot = useCallback(
    (id: string) => {
      if (id === nextClickId) {
        setWrongHint(false);
        setCompletedIds((prev) => new Set(prev).add(id));
        return;
      }
      flashWrong();
    },
    [flashWrong, nextClickId],
  );

  const onDecoy = useCallback(() => {
    flashWrong();
  }, [flashWrong]);

  const miniProps = {
    clicks: config.clicks,
    completedIds,
    nextClickId,
    onHotspot,
    onDecoy,
  };

  useEffect(() => {
    if (config.toolId === "schedule") {
      onToolStateChange?.(scheduleState);
      return;
    }
    onToolStateChange?.({
      completedClickIds: [...completedIds],
      selectedSlot: null,
      bookingSaved: completedIds.size > 0 && allDone,
    });
  }, [
    allDone,
    completedIds,
    config.toolId,
    onToolStateChange,
    scheduleState,
  ]);

  return (
    <div className="rounded-lg border border-navy/15 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/60">
        {practiceCopy.mockCallToolSectionTitle}
      </p>
      <p className="mt-1 font-display text-sm font-semibold text-ink">
        {config.title}
      </p>
      <p className="mt-1 text-xs text-muted">{config.intro}</p>
      <p className="mt-1 text-xs text-muted">{practiceCopy.mockCallToolSectionIntro}</p>

      <ol className="mt-3 space-y-1.5">
        {config.clicks.map((step, i) => {
          const done = completedIds.has(step.id);
          const active = step.id === nextClickId;
          return (
            <li
              key={step.id}
              className={cn(
                "flex gap-2 text-xs",
                done ? "text-navy" : active ? "font-medium text-ink" : "text-muted",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  done
                    ? "bg-teal-bright/30 text-navy"
                    : active
                      ? "bg-navy text-white"
                      : "bg-sand text-navy/60",
                )}
              >
                {done ? "✓" : i + 1}
              </span>
              <span>
                {step.label}
                {done ? (
                  <span className="ml-1 text-teal-bright/90">
                    ({practiceCopy.mockCallToolStepDone})
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-4">
        {config.toolId === "schedule" ? (
          <ScheduleToolMini
            {...miniProps}
            scheduleFixture={config.scheduleFixture}
            onScheduleStateChange={setScheduleState}
          />
        ) : null}
        {config.toolId === "patientAccount" ? (
          <PatientAccountToolMini {...miniProps} />
        ) : null}
        {config.toolId === "claimStatus" ? (
          <ClaimStatusToolMini {...miniProps} />
        ) : null}
        {config.toolId === "insurancePrimary" ? (
          <InsurancePrimaryToolMini {...miniProps} />
        ) : null}
        {config.toolId === "eligibility" ? (
          <EligibilityToolMini {...miniProps} />
        ) : null}
        {config.toolId === "priorAuth" ? (
          <PriorAuthToolMini {...miniProps} />
        ) : null}
      </div>

      {wrongHint ? (
        <p className="mt-2 text-xs text-amber-800" role="status">
          {practiceCopy.mockCallToolWrongControl}
        </p>
      ) : null}
      {!allDone ? (
        <p className="mt-2 text-xs text-muted">{practiceCopy.mockCallToolOptionalNote}</p>
      ) : (
        <p className="mt-2 text-xs text-navy" role="status">
          {practiceCopy.mockCallToolAllDone}
        </p>
      )}
    </div>
  );
}
