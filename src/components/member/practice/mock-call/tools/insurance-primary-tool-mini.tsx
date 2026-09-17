"use client";

import type { MockCallToolMiniProps } from "@/components/member/practice/mock-call/tools/mock-call-tool-mini-props";
import { PmClickable } from "@/components/member/practice/mock-call/tools/pm/pm-clickable";
import { PracticePmAppShell } from "@/components/member/practice/mock-call/tools/pm/practice-pm-app-shell";
import { pmPayers, pmPatients, type PmNavModuleId } from "@/components/member/practice/mock-call/tools/pm/practice-pm-fixtures";
import { PmSelect } from "@/components/member/practice/mock-call/tools/pm/pm-select";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function InsurancePrimaryToolMini({
  completedIds,
  nextClickId,
  onHotspot,
  onDecoy,
}: MockCallToolMiniProps) {
  const [payer, setPayer] = useState("aetna");
  const onDemo = completedIds.has("demographics");
  const onPrimary = completedIds.has("primaryIns");

  const handleNav = (navId: PmNavModuleId) => {
    if (navId === "patients") return;
    onDecoy();
  };

  return (
    <PracticePmAppShell
      activeNav="patients"
      breadcrumb={[
        "Patients",
        pmPatients.janeDoe.name,
        onDemo ? "Demographics" : "Chart",
      ]}
      onDecoy={onDecoy}
      onNavClick={handleNav}
      toolbar={
        <PmClickable
          variant="button"
          done={completedIds.has("saveIns")}
          className="text-[10px]"
          onClick={() => {
            if (nextClickId === "saveIns") onHotspot("saveIns");
            else onDecoy();
          }}
        >
          Save
        </PmClickable>
      }
    >
      <div className="space-y-3">
        <div className="rounded-md border border-border bg-white px-3 py-2">
          <p className="font-semibold text-sm text-ink">{pmPatients.janeDoe.name}</p>
          <p className="text-[10px] text-muted">{pmPatients.janeDoe.mrn}</p>
        </div>

        <div className="flex gap-0 border-b border-border">
          <PmClickable
            variant="tab"
            done={onDemo}
            onClick={() => {
              if (nextClickId === "demographics") onHotspot("demographics");
              else onDecoy();
            }}
          >
            Demographics
          </PmClickable>
          <PmClickable variant="tab" className="opacity-60" onClick={onDecoy}>
            Insurance (old UI)
          </PmClickable>
          <PmClickable variant="tab" className="opacity-60" onClick={onDecoy}>
            Appointments
          </PmClickable>
        </div>

        {onDemo ? (
          <div className="rounded-md border border-border bg-white p-3">
            <PmClickable
              variant="button"
              done={onPrimary}
              className="mb-2 w-full text-left"
              onClick={() => {
                if (nextClickId === "primaryIns") onHotspot("primaryIns");
                else onDecoy();
              }}
            >
              Primary Insurance ▾
            </PmClickable>

            {onPrimary ? (
              <PmSelect
                label="Payer"
                value={payer}
                options={[
                  { value: "bcbs", label: `${pmPayers.blueCross} — Member ••••4821` },
                  { value: "aetna", label: pmPayers.aetna },
                ]}
                onChange={(v) => {
                  setPayer(v);
                  if (v === "bcbs" && nextClickId === "updatePayer") {
                    onHotspot("updatePayer");
                  } else if (v !== "bcbs") {
                    onDecoy();
                  }
                }}
              />
            ) : (
              <p className="text-[11px] text-muted">
                Expand Primary Insurance to update payer on the call.
              </p>
            )}

            {completedIds.has("updatePayer") ? (
              <p
                className={cn(
                  "mt-2 rounded-md bg-teal-bright/10 px-2 py-1 text-[11px] text-navy",
                )}
                role="status"
              >
                Simulated: Primary set to {pmPayers.blueCross}.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-muted">Open Demographics while confirming Insurance on the phone.</p>
        )}
      </div>
    </PracticePmAppShell>
  );
}
