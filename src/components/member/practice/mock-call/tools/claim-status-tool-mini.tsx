"use client";

import type { MockCallToolMiniProps } from "@/components/member/practice/mock-call/tools/mock-call-tool-mini-props";
import { PmClickable } from "@/components/member/practice/mock-call/tools/pm/pm-clickable";
import { PmPatientSearchList } from "@/components/member/practice/mock-call/tools/pm/pm-patient-search";
import { PracticePmAppShell } from "@/components/member/practice/mock-call/tools/pm/practice-pm-app-shell";
import { pmClaims, type PmNavModuleId } from "@/components/member/practice/mock-call/tools/pm/practice-pm-fixtures";
import { PmSelect } from "@/components/member/practice/mock-call/tools/pm/pm-select";
import { PmTable } from "@/components/member/practice/mock-call/tools/pm/pm-table";

export function ClaimStatusToolMini({
  completedIds,
  nextClickId,
  onHotspot,
  onDecoy,
}: MockCallToolMiniProps) {
  const hasSearch = completedIds.has("patientSearch");
  const hasClaim = completedIds.has("openClaim");
  const lab = pmClaims.lab8842;

  const handleNav = (navId: PmNavModuleId) => {
    if (navId === "claims" || navId === "billing") {
      if (!hasSearch && nextClickId === "patientSearch") {
        return;
      }
      if (navId === "billing" && nextClickId !== "patientSearch") {
        onDecoy();
      }
      return;
    }
    onDecoy();
  };

  return (
    <PracticePmAppShell
      activeNav="claims"
      breadcrumb={
        hasClaim
          ? ["Claims", `Claim #${lab.claimNumber}`, "Notes"]
          : hasSearch
            ? ["Claims", "Worklist"]
            : ["Claims", "Search"]
      }
      onDecoy={onDecoy}
      onNavClick={handleNav}
      navDoneIds={new Set(["claims"])}
      toolbar={
        <PmSelect
          label="Status filter"
          value="pending"
          options={[
            { value: "pending", label: "Pending payer" },
            { value: "paid", label: "Paid (decoy)" },
          ]}
          onDecoyChange={onDecoy}
        />
      }
    >
      {!hasSearch ? (
        <div className="space-y-3">
          <p className="text-xs text-muted">Locate patient and DOS from the call.</p>
          <PmPatientSearchList
            results={[
              {
                hotspotId: "patientSearch",
                label: `Search — Martinez + DOS ${lab.dos}`,
              },
            ]}
            nextClickId={nextClickId}
            completedIds={completedIds}
            onHotspot={onHotspot}
            onDecoy={onDecoy}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <PmTable
            columns={["Claim #", "DOS", "Service", "Status"]}
            rows={[
              {
                id: lab.id,
                cells: [
                  lab.claimNumber,
                  lab.dos,
                  lab.description,
                  lab.status,
                ],
                done: hasClaim,
                onClick: () => {
                  if (nextClickId === "openClaim") onHotspot("openClaim");
                  else onDecoy();
                },
              },
              {
                id: "decoy",
                cells: ["7711", "03/01/2026", "X-ray", "Paid"],
                onClick: onDecoy,
              },
            ]}
          />
          {hasClaim ? (
            <div className="rounded-md border border-border bg-white p-3">
              <p className="text-[11px] font-semibold text-navy/70">Chart notes</p>
              <PmClickable
                variant="button"
                done={completedIds.has("noteStatus")}
                className="mt-2 w-full"
                onClick={() => {
                  if (nextClickId === "noteStatus") onHotspot("noteStatus");
                  else onDecoy();
                }}
              >
                Add note — Hold collections, pending Insurance
              </PmClickable>
            </div>
          ) : null}
        </div>
      )}
    </PracticePmAppShell>
  );
}
