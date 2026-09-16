"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppointmentSheet } from "@/components/member/practice/scheduling/appointment-sheet";
import { SchedulingCalendarGrid } from "@/components/member/practice/scheduling/scheduling-calendar-grid";
import { SchedulingSidebar } from "@/components/member/practice/scheduling/scheduling-sidebar";
import {
  SchedulingToolbar,
  type SchedulingView,
} from "@/components/member/practice/scheduling/scheduling-toolbar";
import { PracticeDisclaimer } from "@/components/member/practice/practice-disclaimer";
import { Button } from "@/components/ui/button";
import { practiceCopy } from "@/content/site";
import { PRACTICE_PROVIDERS } from "@/lib/practice/constants";
import { addDays, weekDays } from "@/lib/practice/scheduling-calendar";
import {
  createEmptyAppointment,
  createEmptyBlock,
} from "@/lib/practice/seed-appointments";
import type { PracticeAppointment } from "@/lib/practice/types";
import { usePracticeAppointments } from "@/lib/practice/use-practice-appointments";
import { usePracticePatients } from "@/lib/practice/use-practice-patients";

export function PatientSchedulingWorkspace({
  ownerUserId,
}: {
  ownerUserId: string;
}) {
  const { patients, loading: patientsLoading } = usePracticePatients(ownerUserId);
  const {
    appointments,
    loading: appointmentsLoading,
    error,
    saveAppointment,
    removeAppointment,
  } = usePracticeAppointments(ownerUserId);

  const registeredPatients = useMemo(
    () => patients.filter((p) => p.status === "registered"),
    [patients],
  );

  const patientsById = useMemo(() => {
    const map = new Map<string, (typeof patients)[number]>();
    for (const p of patients) map.set(p.id, p);
    return map;
  }, [patients]);

  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [view, setView] = useState<SchedulingView>("week");
  const [providerFilter, setProviderFilter] = useState("");
  const [sheetAppointment, setSheetAppointment] =
    useState<PracticeAppointment | null>(null);

  const calendarDays = useMemo(() => {
    if (view === "day") return [anchorDate];
    return weekDays(anchorDate, 0);
  }, [anchorDate, view]);

  function openNewAt(startsAt: string, provider?: string) {
    if (registeredPatients.length === 0) return;
    const empty = createEmptyAppointment(registeredPatients[0]?.id ?? "");
    empty.startsAt = startsAt;
    if (provider && PRACTICE_PROVIDERS.includes(provider as (typeof PRACTICE_PROVIDERS)[number])) {
      empty.providerName = provider;
    }
    setSheetAppointment(empty);
  }

  return (
    <div className="space-y-4">
      <PracticeDisclaimer />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="accent"
          disabled={registeredPatients.length === 0}
          onClick={() => openNewAt(new Date().toISOString(), providerFilter)}
        >
          {practiceCopy.schedulingNew}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setSheetAppointment(createEmptyBlock())}>
          {practiceCopy.schedulingNewBlock}
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/member/practice">Back to Practice Lab</Link>
        </Button>
      </div>

      {registeredPatients.length === 0 && !patientsLoading ? (
        <p className="text-sm text-amber-900/80">{practiceCopy.schedulingNoPatients}</p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(47,56,38,0.04)]">
        <SchedulingToolbar
          anchorDate={anchorDate}
          view={view}
          providerFilter={providerFilter}
          onToday={() => setAnchorDate(new Date())}
          onPrev={() =>
            setAnchorDate((d) => addDays(d, view === "day" ? -1 : -7))
          }
          onNext={() =>
            setAnchorDate((d) => addDays(d, view === "day" ? 1 : 7))
          }
          onJumpPrev={() =>
            setAnchorDate(
              (d) =>
                new Date(d.getFullYear(), d.getMonth() - 1, d.getDate()),
            )
          }
          onJumpNext={() =>
            setAnchorDate(
              (d) =>
                new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()),
            )
          }
          onViewChange={setView}
          onProviderChange={setProviderFilter}
        />

        <div className="flex flex-col lg:flex-row">
          <SchedulingSidebar
            anchorDate={anchorDate}
            onSelectDay={(day) => {
              setAnchorDate(day);
              if (view === "week") setView("day");
            }}
          />

          {patientsLoading || appointmentsLoading ? (
            <p className="flex-1 p-8 text-center text-sm text-muted">Loading calendar…</p>
          ) : (
            <SchedulingCalendarGrid
              days={calendarDays}
              appointments={appointments}
              patientsById={patientsById}
              providerFilter={providerFilter}
              onSlotClick={(day, startsAt) => {
                setAnchorDate(day);
                openNewAt(startsAt, providerFilter);
              }}
              onEventClick={setSheetAppointment}
            />
          )}
        </div>
      </div>

      <p className="text-xs text-muted">{practiceCopy.schedulingSimNote}</p>

      <AppointmentSheet
        open={sheetAppointment !== null}
        appointment={sheetAppointment}
        registeredPatients={registeredPatients}
        onClose={() => setSheetAppointment(null)}
        onSave={async (next) => {
          await saveAppointment(next);
        }}
        onDelete={async () => {
          if (sheetAppointment) await removeAppointment(sheetAppointment.id);
        }}
      />
    </div>
  );
}
