"use client";

import { SchedulingEventBlock } from "@/components/member/practice/scheduling/scheduling-event-block";
import { practiceCopy } from "@/content/site";
import {
  SCHEDULING_CLINIC_END_HOUR,
  SCHEDULING_CLINIC_START_HOUR,
  SCHEDULING_PIXELS_PER_HOUR,
} from "@/lib/practice/constants";
import {
  appointmentsForDay,
  calendarGridHeightPx,
  formatDayHeader,
  formatHourLabel,
  layoutDayEvents,
  snapSlotFromClick,
} from "@/lib/practice/scheduling-calendar";
import type { PracticeAppointment, PracticePatient } from "@/lib/practice/types";
import { cn } from "@/lib/utils";

const HOURS = Array.from(
  { length: SCHEDULING_CLINIC_END_HOUR - SCHEDULING_CLINIC_START_HOUR },
  (_, i) => SCHEDULING_CLINIC_START_HOUR + i,
);

export function SchedulingCalendarGrid({
  days,
  appointments,
  patientsById,
  providerFilter,
  onSlotClick,
  onEventClick,
}: {
  days: Date[];
  appointments: PracticeAppointment[];
  patientsById: Map<string, PracticePatient>;
  providerFilter: string;
  onSlotClick: (day: Date, startsAt: string) => void;
  onEventClick: (appointment: PracticeAppointment) => void;
}) {
  const gridHeight = calendarGridHeightPx();

  return (
    <div className="min-w-0 flex-1 overflow-x-auto">
      <div
        className="inline-block min-w-full"
        style={{
          minWidth: days.length > 1 ? `${days.length * 88 + 48}px` : undefined,
        }}
      >
        <div
          className="grid border-b border-border bg-cream/40"
          style={{
            gridTemplateColumns: `3rem repeat(${days.length}, minmax(5.5rem, 1fr))`,
          }}
        >
          <div className="border-r border-border" />
          {days.map((day) => {
            const { weekday, md } = formatDayHeader(day);
            return (
              <div
                key={day.toISOString()}
                className="border-r border-border px-1 py-2 text-center last:border-r-0"
              >
                <p className="text-[10px] font-semibold tracking-wide text-muted uppercase">
                  {weekday}
                </p>
                <p className="text-sm font-semibold text-ink">{md}</p>
              </div>
            );
          })}
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: `3rem repeat(${days.length}, minmax(5.5rem, 1fr))`,
          }}
        >
          <div className="relative border-r border-border bg-white">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="border-b border-border/80 pr-1 text-right text-[10px] text-muted"
                style={{ height: SCHEDULING_PIXELS_PER_HOUR }}
              >
                <span className="-mt-2 inline-block">{formatHourLabel(hour)}</span>
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayEvents = appointmentsForDay(
              appointments,
              day,
              providerFilter,
            );
            const layout = layoutDayEvents(dayEvents);

            return (
              <div
                key={day.toISOString()}
                className="relative cursor-pointer border-r border-border bg-white last:border-r-0"
                style={{ height: gridHeight }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const offsetY = e.clientY - rect.top;
                  onSlotClick(day, snapSlotFromClick(day, offsetY));
                }}
                role="presentation"
              >
                {HOURS.map((hour, idx) => (
                  <div
                    key={hour}
                    className={cn(
                      "pointer-events-none absolute inset-x-0 border-b border-border/60",
                    )}
                    style={{
                      top: idx * SCHEDULING_PIXELS_PER_HOUR,
                      height: SCHEDULING_PIXELS_PER_HOUR,
                    }}
                  />
                ))}

                {layout.map(({ appointment, topPx, heightPx }) => (
                  <SchedulingEventBlock
                    key={appointment.id}
                    appointment={appointment}
                    patient={patientsById.get(appointment.patientId)}
                    topPx={topPx}
                    heightPx={heightPx}
                    onSelect={() => onEventClick(appointment)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {appointments.length === 0 ? (
        <p className="p-4 text-center text-sm text-muted">
          {practiceCopy.schedulingEmptyGrid}
        </p>
      ) : null}
    </div>
  );
}
