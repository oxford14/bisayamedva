import type {
  PracticeAppointment,
  PracticeAppointmentKind,
} from "@/lib/practice/types";

/** Backfill fields for appointments stored before schema v3. */
export function normalizePracticeAppointment(
  row: PracticeAppointment & { kind?: PracticeAppointmentKind },
): PracticeAppointment {
  return {
    ...row,
    kind: row.kind ?? "appointment",
  };
}
