"use client";

import type { MockCallToolMiniProps } from "@/components/member/practice/mock-call/tools/mock-call-tool-mini-props";
import { PmClickable } from "@/components/member/practice/mock-call/tools/pm/pm-clickable";
import { PmPatientSearchList } from "@/components/member/practice/mock-call/tools/pm/pm-patient-search";
import { PracticePmAppShell } from "@/components/member/practice/mock-call/tools/pm/practice-pm-app-shell";
import {
  pmClaims,
  pmPatients,
  type PmNavModuleId,
} from "@/components/member/practice/mock-call/tools/pm/practice-pm-fixtures";
import { PmSelect } from "@/components/member/practice/mock-call/tools/pm/pm-select";
import { PmTable } from "@/components/member/practice/mock-call/tools/pm/pm-table";
import { cn } from "@/lib/utils";

export function PatientAccountToolMini({
  completedIds,
  nextClickId,
  onHotspot,
  onDecoy,
}: MockCallToolMiniProps) {
  const hasAccount = completedIds.has("openAccount");
  const onClaimsTab = completedIds.has("claimsTab");
  const claim = pmClaims.balanceMarch12;

  const handleNav = (navId: PmNavModuleId) => {
    if (navId === "patients") return;
    onDecoy();
  };

  const breadcrumb = hasAccount
    ? ["Patients", pmPatients.mariaSantos.name, onClaimsTab ? "Claims" : "Chart"]
    : ["Patients", "Search"];

  return (
    <PracticePmAppShell
      activeNav="patients"
      breadcrumb={breadcrumb}
      onDecoy={onDecoy}
      onNavClick={handleNav}
      navDoneIds={
        new Set(completedIds.has("openAccount") ? ["patients"] : [])
      }
      toolbar={
        <PmSelect
          label="Location"
          value="rfm-main"
          options={[
            { value: "rfm-main", label: "Riverside Family — Main" },
            { value: "rfm-north", label: "Riverside — North (decoy)" },
          ]}
          onDecoyChange={onDecoy}
        />
      }
    >
      {!hasAccount ? (
        <div className="space-y-3">
          <p className="text-xs text-muted">
            Search patient chart while you explain balance on the call.
          </p>
          <PmPatientSearchList
            results={[
              {
                hotspotId: "openAccount",
                label: pmPatients.mariaSantos.searchLabel,
              },
              {
                hotspotId: "decoy",
                label: pmPatients.wrongPatient.searchLabel,
                decoy: true,
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
          <div className="rounded-md border border-border bg-white px-3 py-2">
            <p className="font-semibold text-sm text-ink">
              {pmPatients.mariaSantos.name}
            </p>
            <p className="text-[10px] text-muted">
              {pmPatients.mariaSantos.mrn} · DOB {pmPatients.mariaSantos.dob}
            </p>
          </div>

          <div className="flex gap-0 border-b border-border">
            <PmClickable
              variant="tab"
              done={completedIds.has("claimsTab")}
              className={cn(
                !onClaimsTab && "border-b border-border bg-[#f4f6f8] text-muted",
              )}
              onClick={() => {
                if (nextClickId === "claimsTab") onHotspot("claimsTab");
                else onDecoy();
              }}
            >
              Claims
            </PmClickable>
            <PmClickable variant="tab" className="opacity-60" onClick={onDecoy}>
              Ledger
            </PmClickable>
            <PmClickable variant="tab" className="opacity-60" onClick={onDecoy}>
              Demographics
            </PmClickable>
          </div>

          {onClaimsTab ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <PmTable
                columns={["DOS", "Description", "Status", "Pt balance"]}
                rows={[
                  {
                    id: claim.id,
                    cells: [
                      claim.dos,
                      claim.description,
                      claim.status,
                      claim.patientBalance,
                    ],
                    done: completedIds.has("viewBalance"),
                    onClick: () => {
                      if (nextClickId === "viewBalance") onHotspot("viewBalance");
                      else onDecoy();
                    },
                  },
                  {
                    id: "decoy-claim",
                    cells: [
                      "02/01/2026",
                      "Preventive — Paid",
                      "Closed",
                      "$0.00",
                    ],
                    onClick: onDecoy,
                  },
                ]}
              />
              {completedIds.has("viewBalance") ? (
                <div className="rounded-md border border-border bg-white p-3 text-xs">
                  <p className="font-semibold text-ink">Claim detail</p>
                  <p className="mt-2 text-muted">Insurance: processing</p>
                  <p className="text-ink">
                    Patient responsibility: {claim.patientBalance}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border p-3 text-[11px] text-muted">
                  Select a claim row to open detail.
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted">Open the Claims tab for billing lines.</p>
          )}
        </div>
      )}
    </PracticePmAppShell>
  );
}
