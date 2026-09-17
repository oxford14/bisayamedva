"use client";

import type { MockCallToolMiniProps } from "@/components/member/practice/mock-call/tools/mock-call-tool-mini-props";
import { PmClickable } from "@/components/member/practice/mock-call/tools/pm/pm-clickable";
import { PracticePmAppShell } from "@/components/member/practice/mock-call/tools/pm/practice-pm-app-shell";
import { pmPatients, type PmNavModuleId } from "@/components/member/practice/mock-call/tools/pm/practice-pm-fixtures";
import { PmSelect } from "@/components/member/practice/mock-call/tools/pm/pm-select";

export function EligibilityToolMini({
  completedIds,
  nextClickId,
  onHotspot,
  onDecoy,
}: MockCallToolMiniProps) {
  const onModule = completedIds.has("openElig");
  const ranCheck = completedIds.has("runCheck");

  const handleNav = (navId: PmNavModuleId) => {
    if (navId === "eligibility" && nextClickId === "openElig") {
      onHotspot("openElig");
      return;
    }
    if (navId !== "eligibility") {
      onDecoy();
    }
  };

  return (
    <PracticePmAppShell
      activeNav={onModule ? "eligibility" : "patients"}
      breadcrumb={
        onModule
          ? ["Eligibility", pmPatients.janeDoe.name, ranCheck ? "Results" : "Request"]
          : ["Home"]
      }
      onDecoy={onDecoy}
      onNavClick={handleNav}
      navDoneIds={new Set(onModule ? ["eligibility"] : [])}
      toolbar={
        <PmSelect
          label="Service type"
          value="specialist"
          options={[
            { value: "specialist", label: "Specialist visit 04/22" },
            { value: "dme", label: "DME (decoy)" },
          ]}
          onDecoyChange={onDecoy}
        />
      }
    >
      {!onModule ? (
        <p className="text-xs text-muted">
          Open <strong>Eligibility</strong> sa left menu to run a benefits check.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="rounded-md border border-border bg-white px-3 py-2 text-xs">
            <p className="font-semibold text-ink">{pmPatients.janeDoe.name}</p>
            <p className="text-muted">Primary Insurance on file (simulated)</p>
          </div>

          <PmClickable
            variant="button"
            done={ranCheck}
            className="w-full bg-navy/5"
            onClick={() => {
              if (nextClickId === "runCheck") onHotspot("runCheck");
              else onDecoy();
            }}
          >
            Run Eligibility
          </PmClickable>

          {ranCheck ? (
            <>
              <div className="rounded-md border border-dashed border-border bg-white/80 px-3 py-2 text-[11px] text-muted">
                Result (sim): Active — In-network — Copay $40 — Specialist 04/22
              </div>
              <PmClickable
                variant="button"
                done={completedIds.has("saveNote")}
                className="w-full"
                onClick={() => {
                  if (nextClickId === "saveNote") onHotspot("saveNote");
                  else onDecoy();
                }}
              >
                Save note to patient account
              </PmClickable>
            </>
          ) : null}
        </div>
      )}
    </PracticePmAppShell>
  );
}
