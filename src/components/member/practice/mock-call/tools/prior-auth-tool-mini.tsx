"use client";

import type { MockCallToolMiniProps } from "@/components/member/practice/mock-call/tools/mock-call-tool-mini-props";
import { PmClickable } from "@/components/member/practice/mock-call/tools/pm/pm-clickable";
import { PracticePmAppShell } from "@/components/member/practice/mock-call/tools/pm/practice-pm-app-shell";
import type { PmNavModuleId } from "@/components/member/practice/mock-call/tools/pm/practice-pm-fixtures";
import { PmSelect } from "@/components/member/practice/mock-call/tools/pm/pm-select";
import { PmTable } from "@/components/member/practice/mock-call/tools/pm/pm-table";

export function PriorAuthToolMini({
  completedIds,
  nextClickId,
  onHotspot,
  onDecoy,
}: MockCallToolMiniProps) {
  const onQueue = completedIds.has("authQueue");
  const onOrder = completedIds.has("openOrder");

  const handleNav = (navId: PmNavModuleId) => {
    if (navId === "auth" && nextClickId === "authQueue") {
      onHotspot("authQueue");
      return;
    }
    if (navId !== "auth") {
      onDecoy();
    }
  };

  return (
    <PracticePmAppShell
      activeNav={onQueue ? "auth" : "patients"}
      breadcrumb={
        onOrder
          ? ["Prior Auth", "MRI lumbar", "Follow-up"]
          : onQueue
            ? ["Prior Auth", "Queue"]
            : ["Home"]
      }
      onDecoy={onDecoy}
      onNavClick={handleNav}
      navDoneIds={new Set(onQueue ? ["auth"] : [])}
      toolbar={
        <PmSelect
          label="Queue filter"
          value="pending"
          options={[
            { value: "pending", label: "Awaiting payer" },
            { value: "approved", label: "Approved (decoy)" },
          ]}
          onDecoyChange={onDecoy}
        />
      }
    >
      {!onQueue ? (
        <p className="text-xs text-muted">
          Open <strong>Prior Auth</strong> sa left menu to review pending orders.
        </p>
      ) : (
        <div className="space-y-3">
          <PmTable
            columns={["Order", "Status", "Submitted", "Payer"]}
            rows={[
              {
                id: "mri",
                cells: [
                  "MRI lumbar",
                  "Awaiting payer",
                  "04/02/2026",
                  "Blue Cross",
                ],
                done: onOrder,
                onClick: () => {
                  if (nextClickId === "openOrder") onHotspot("openOrder");
                  else onDecoy();
                },
              },
              {
                id: "pt",
                cells: ["PT eval", "Approved", "03/28/2026", "Aetna"],
                onClick: onDecoy,
              },
            ]}
          />

          {onOrder ? (
            <div className="rounded-md border border-border bg-white p-3">
              <p className="text-[11px] font-semibold text-navy/70">Order detail</p>
              <p className="mt-1 text-xs text-muted">
                Submitted — callback patient when payer responds.
              </p>
              <PmClickable
                variant="button"
                done={completedIds.has("logFollowUp")}
                className="mt-2 w-full"
                onClick={() => {
                  if (nextClickId === "logFollowUp") onHotspot("logFollowUp");
                  else onDecoy();
                }}
              >
                Log follow-up — Call patient when payer responds
              </PmClickable>
            </div>
          ) : null}
        </div>
      )}
    </PracticePmAppShell>
  );
}
