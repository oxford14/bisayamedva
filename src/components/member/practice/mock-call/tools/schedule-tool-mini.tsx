"use client";

import { useEffect, useState } from "react";
import type { MockCallToolState } from "@/lib/practice/mock-call/mock-call-tool-state";
import type {
  MockCallScheduleFixture,
  MockCallToolClickStep,
} from "@/lib/practice/mock-call/tool-config";
import type { MockCallToolMiniProps } from "@/components/member/practice/mock-call/tools/mock-call-tool-mini-props";
import { PmClickable } from "@/components/member/practice/mock-call/tools/pm/pm-clickable";
import { PmPatientSearchList } from "@/components/member/practice/mock-call/tools/pm/pm-patient-search";
import {
  PmScheduleWeekView,
  type SelectedScheduleSlot,
} from "@/components/member/practice/mock-call/tools/pm/pm-schedule-week-view";
import { PracticePmAppShell } from "@/components/member/practice/mock-call/tools/pm/practice-pm-app-shell";
import { pmPatients, type PmNavModuleId } from "@/components/member/practice/mock-call/tools/pm/practice-pm-fixtures";
import { PmSelect } from "@/components/member/practice/mock-call/tools/pm/pm-select";
import { cn } from "@/lib/utils";

const FALLBACK_SLOTS = ["9:00 AM", "10:00 AM", "1:30 PM", "3:00 PM"];

type Props = MockCallToolMiniProps & {
  clicks: MockCallToolClickStep[];
  scheduleFixture?: MockCallScheduleFixture;
  onScheduleStateChange?: (state: MockCallToolState) => void;
};

export function ScheduleToolMini({
  clicks,
  scheduleFixture,
  completedIds,
  nextClickId,
  onHotspot,
  onDecoy,
  onScheduleStateChange,
}: Props) {
  const [selectedSlot, setSelectedSlot] = useState<SelectedScheduleSlot | null>(
    null,
  );

  const patient =
    scheduleFixture?.patientKey != null
      ? pmPatients[scheduleFixture.patientKey]
      : pmPatients.janeDoe;

  const onSchedule = completedIds.has("openSchedule");
  const hasPatient = completedIds.has("searchPatient");
  const hasSlot = completedIds.has("selectSlot");
  const lookupOnly =
    !clicks.some((c) => c.id === "selectSlot") &&
    (scheduleFixture?.slots.length ?? 0) === 0;

  const focusDayLabel = scheduleFixture?.focusWeekday ?? "Mon";

  const handleNav = (navId: PmNavModuleId) => {
    if (navId === "schedule" && nextClickId === "openSchedule") {
      onHotspot("openSchedule");
      return;
    }
    if (navId !== "schedule") {
      onDecoy();
    }
  };

  const breadcrumb = onSchedule
    ? hasPatient
      ? [
          "Schedule",
          patient.name,
          hasSlot ? "Confirm" : `${focusDayLabel} slots`,
        ]
      : ["Schedule", scheduleFixture?.weekLabel ?? "Week view"]
    : ["Home"];

  const handleSelectOfferSlot = (slot: SelectedScheduleSlot) => {
    setSelectedSlot(slot);
    if (nextClickId === "selectSlot") {
      onHotspot("selectSlot");
    }
  };

  useEffect(() => {
    onScheduleStateChange?.({
      completedClickIds: [...completedIds],
      selectedSlot,
      bookingSaved: completedIds.has("saveAppt"),
    });
  }, [completedIds, onScheduleStateChange, selectedSlot]);

  return (
    <PracticePmAppShell
      activeNav={onSchedule ? "schedule" : "patients"}
      breadcrumb={breadcrumb}
      onDecoy={onDecoy}
      onNavClick={handleNav}
      navDoneIds={new Set(onSchedule ? ["schedule"] : [])}
      toolbar={
        <PmSelect
          label="Provider"
          value="dr-lee"
          options={[
            {
              value: "dr-lee",
              label: scheduleFixture?.providerLabel ?? "Dr. Lee — Family Med",
            },
            { value: "dr-park", label: "Dr. Park (decoy)" },
          ]}
          onDecoyChange={onDecoy}
        />
      }
    >
      {!onSchedule ? (
        <p className="text-xs text-muted">
          Click <strong>Schedule</strong> sa left menu to open the calendar.
        </p>
      ) : (
        <div className="space-y-3">
          {!hasPatient ? (
            <>
              <p className="text-[11px] font-semibold text-navy/70">
                Find patient for reschedule
              </p>
              <PmPatientSearchList
                results={[
                  {
                    hotspotId: "searchPatient",
                    label: patient.searchLabel,
                  },
                  {
                    hotspotId: "x",
                    label: pmPatients.wrongPatient.searchLabel,
                    decoy: true,
                  },
                ]}
                nextClickId={nextClickId}
                completedIds={completedIds}
                onHotspot={onHotspot}
                onDecoy={onDecoy}
                hintName={patient.name}
              />
            </>
          ) : lookupOnly && hasPatient ? (
            <div className="rounded-md border border-teal-bright/30 bg-teal-bright/10 px-3 py-2 text-xs text-ink">
              <p className="font-semibold text-navy">Chart opened</p>
              <p className="mt-1">
                {patient.name} — {patient.mrn} — DOB {patient.dob}
              </p>
              <p className="mt-1 text-muted">
                Ready for appointment details on later steps.
              </p>
            </div>
          ) : scheduleFixture && scheduleFixture.slots.length > 0 ? (
            <>
              <p className="text-xs text-ink">
                {patient.name} — {scheduleFixture.weekLabel}
              </p>
              <PmScheduleWeekView
                fixture={scheduleFixture}
                selectedSlot={selectedSlot}
                slotStepDone={hasSlot}
                nextClickId={nextClickId}
                onSelectOfferSlot={handleSelectOfferSlot}
                onDecoy={onDecoy}
              />
              {hasSlot && selectedSlot ? (
                <p className="text-xs text-navy" role="status">
                  {selectedSlot.weekday} {selectedSlot.time} —{" "}
                  {scheduleFixture.appointmentType ?? "Visit"},{" "}
                  {scheduleFixture.providerLabel ?? "Dr. Lee"}
                </p>
              ) : null}
              {hasSlot && clicks.some((c) => c.id === "saveAppt") ? (
                <PmClickable
                  variant="button"
                  done={completedIds.has("saveAppt")}
                  className="bg-navy/5"
                  onClick={() => {
                    if (nextClickId === "saveAppt") onHotspot("saveAppt");
                    else onDecoy();
                  }}
                >
                  Save appointment
                </PmClickable>
              ) : null}
            </>
          ) : (
            <>
              <p className="text-xs text-ink">
                {patient.name} — open slots (simulated week)
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {FALLBACK_SLOTS.map((t) => (
                  <PmClickable
                    key={t}
                    variant="button"
                    done={completedIds.has("selectSlot") && t === "10:00 AM"}
                    className={cn("text-center text-[11px]")}
                    onClick={() => {
                      if (t === "10:00 AM" && nextClickId === "selectSlot") {
                        onHotspot("selectSlot");
                      } else {
                        onDecoy();
                      }
                    }}
                  >
                    {t}
                    <span className="block text-[10px] font-normal text-muted">
                      {t === "10:00 AM" ? "Open" : "Booked"}
                    </span>
                  </PmClickable>
                ))}
              </div>
              {hasSlot && clicks.some((c) => c.id === "saveAppt") ? (
                <PmClickable
                  variant="button"
                  done={completedIds.has("saveAppt")}
                  className="bg-navy/5"
                  onClick={() => {
                    if (nextClickId === "saveAppt") onHotspot("saveAppt");
                    else onDecoy();
                  }}
                >
                  Save appointment
                </PmClickable>
              ) : null}
            </>
          )}
        </div>
      )}
    </PracticePmAppShell>
  );
}
