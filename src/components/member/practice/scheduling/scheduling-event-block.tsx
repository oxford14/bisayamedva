import { formatTimeRange } from "@/lib/practice/scheduling-calendar";
import type { PracticeAppointment, PracticePatient } from "@/lib/practice/types";
import { cn } from "@/lib/utils";

export function eventBlockClassName(appointment: PracticeAppointment) {
  if (appointment.kind === "block") {
    return "border-navy/25 bg-navy/10 text-navy";
  }
  switch (appointment.status) {
    case "scheduled":
      return "border-teal-bright/40 bg-teal-bright/25 text-navy";
    case "checked_in":
      return "border-border bg-sand text-navy";
    case "completed":
      return "border-teal-bright/50 bg-teal-bright/40 text-navy";
    default:
      return "border-border bg-white text-ink";
  }
}

export function SchedulingEventBlock({
  appointment,
  patient,
  topPx,
  heightPx,
  onSelect,
}: {
  appointment: PracticeAppointment;
  patient?: PracticePatient;
  topPx: number;
  heightPx: number;
  onSelect: () => void;
}) {
  const title =
    appointment.kind === "block"
      ? appointment.reasonForVisit || appointment.notes || "Time block"
      : patient
        ? `${patient.legalLastName}, ${patient.legalFirstName}`
        : "Patient";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        "absolute inset-x-1 z-10 overflow-hidden rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm transition hover:brightness-[0.98]",
        eventBlockClassName(appointment),
      )}
      style={{ top: topPx, height: heightPx }}
    >
      <span className="block truncate font-semibold">{title}</span>
      <span className="block truncate opacity-90">
        {formatTimeRange(appointment.startsAt, appointment.durationMinutes)}
      </span>
    </button>
  );
}
