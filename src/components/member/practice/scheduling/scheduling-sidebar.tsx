"use client";

import { practiceCopy } from "@/content/site";
import {
  eventBlockClassName,
} from "@/components/member/practice/scheduling/scheduling-event-block";
import { monthMatrix, sameDay, weekDays } from "@/lib/practice/scheduling-calendar";
import type { PracticeAppointment } from "@/lib/practice/types";
import { cn } from "@/lib/utils";

const LEGEND_SAMPLES: PracticeAppointment[] = [
  {
    id: "legend-new",
    kind: "appointment",
    patientId: "",
    providerName: "Dr. Elena Reyes, MD",
    visitType: "Follow-up",
    location: "Office",
    startsAt: new Date().toISOString(),
    durationMinutes: 30,
    reasonForVisit: "",
    status: "scheduled",
    notes: "",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "legend-requested",
    kind: "appointment",
    patientId: "",
    providerName: "Dr. Elena Reyes, MD",
    visitType: "Follow-up",
    location: "Office",
    startsAt: new Date().toISOString(),
    durationMinutes: 30,
    reasonForVisit: "",
    status: "checked_in",
    notes: "",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "legend-confirmed",
    kind: "appointment",
    patientId: "",
    providerName: "Dr. Elena Reyes, MD",
    visitType: "Follow-up",
    location: "Office",
    startsAt: new Date().toISOString(),
    durationMinutes: 30,
    reasonForVisit: "",
    status: "completed",
    notes: "",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "legend-block",
    kind: "block",
    patientId: "",
    providerName: "Dr. Elena Reyes, MD",
    visitType: "",
    location: "Office",
    startsAt: new Date().toISOString(),
    durationMinutes: 30,
    reasonForVisit: "Block",
    status: "scheduled",
    notes: "",
    createdAt: "",
    updatedAt: "",
  },
];

const LEGEND_META = [
  {
    sample: LEGEND_SAMPLES[0],
    title: practiceCopy.schedulingLegendNew,
    hint: practiceCopy.schedulingLegendNewHint,
  },
  {
    sample: LEGEND_SAMPLES[1],
    title: practiceCopy.schedulingLegendRequested,
    hint: practiceCopy.schedulingLegendRequestedHint,
  },
  {
    sample: LEGEND_SAMPLES[2],
    title: practiceCopy.schedulingLegendConfirmed,
    hint: practiceCopy.schedulingLegendConfirmedHint,
  },
  {
    sample: LEGEND_SAMPLES[3],
    title: practiceCopy.schedulingLegendBlock,
    hint: practiceCopy.schedulingLegendBlockHint,
  },
];

export function SchedulingSidebar({
  anchorDate,
  onSelectDay,
}: {
  anchorDate: Date;
  onSelectDay: (day: Date) => void;
}) {
  const today = new Date();
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(anchorDate);
  const days = monthMatrix(anchorDate);
  const weekSet = new Set(
    weekDays(anchorDate).map((d) => d.toDateString()),
  );

  return (
    <aside className="flex flex-col gap-4 border-b border-border bg-white p-4 lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div>
        <p className="text-center text-sm font-semibold text-ink">{monthLabel}</p>
        <div className="mt-2 grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-muted">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-0.5">
          {days.map((day) => {
            const inMonth = day.getMonth() === anchorDate.getMonth();
            const isToday = sameDay(day, today);
            const inWeek = weekSet.has(day.toDateString());
            const isAnchor = sameDay(day, anchorDate);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelectDay(day)}
                className={cn(
                  "aspect-square rounded text-[11px] font-medium",
                  !inMonth && "text-muted/50",
                  inMonth && "text-ink hover:bg-cream",
                  inWeek && "bg-teal-bright/15",
                  isToday && "ring-1 ring-navy/40",
                  isAnchor && "bg-navy text-white hover:bg-navy",
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold tracking-wide text-navy/60 uppercase">
          {practiceCopy.schedulingLegendTitle}
        </p>
        <ul className="mt-2 space-y-2">
          {LEGEND_META.map(({ sample, title, hint }) => (
            <li key={sample.id} className="flex gap-2">
              <span
                className={cn(
                  "mt-0.5 size-3 shrink-0 rounded-sm border",
                  eventBlockClassName(sample),
                )}
                aria-hidden
              />
              <div>
                <p className="text-xs font-semibold text-ink">{title}</p>
                <p className="text-[10px] leading-snug text-muted">{hint}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

    </aside>
  );
}
