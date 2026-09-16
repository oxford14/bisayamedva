import {
  SCHEDULING_CLINIC_END_HOUR,
  SCHEDULING_CLINIC_START_HOUR,
  SCHEDULING_PIXELS_PER_HOUR,
} from "@/lib/practice/constants";
import type { PracticeAppointment } from "@/lib/practice/types";

export const CALENDAR_HIDDEN_STATUSES = new Set([
  "cancelled",
  "no_show",
]);

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfWeek(date: Date, weekStartsOn = 0) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function weekDays(anchorDate: Date, weekStartsOn = 0) {
  const start = startOfWeek(anchorDate, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dayKey(date: Date) {
  return startOfDay(date).toISOString();
}

export function formatDayHeader(date: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(
    date,
  );
  const md = new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
  }).format(date);
  return { weekday, md, label: `${weekday} ${md}` };
}

export function formatTimeRange(startIso: string, durationMinutes: number) {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const fmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${fmt.format(start)}–${fmt.format(end)}`;
}

export function formatHourLabel(hour: number) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function calendarGridHeightPx() {
  return (
    (SCHEDULING_CLINIC_END_HOUR - SCHEDULING_CLINIC_START_HOUR) *
    SCHEDULING_PIXELS_PER_HOUR
  );
}

export function appointmentsInRange(
  appointments: PracticeAppointment[],
  rangeStart: Date,
  rangeEnd: Date,
  providerFilter: string,
) {
  const startMs = rangeStart.getTime();
  const endMs = rangeEnd.getTime();
  return appointments.filter((a) => {
    if (CALENDAR_HIDDEN_STATUSES.has(a.status)) return false;
    if (providerFilter && a.providerName !== providerFilter) return false;
    const at = new Date(a.startsAt).getTime();
    return at >= startMs && at < endMs;
  });
}

export function appointmentsForDay(
  appointments: PracticeAppointment[],
  day: Date,
  providerFilter: string,
) {
  const start = startOfDay(day);
  const end = addDays(start, 1);
  return appointmentsInRange(appointments, start, end, providerFilter).sort(
    (a, b) => a.startsAt.localeCompare(b.startsAt),
  );
}

export type LayoutedEvent = {
  appointment: PracticeAppointment;
  topPx: number;
  heightPx: number;
};

export function layoutDayEvents(
  dayAppointments: PracticeAppointment[],
): LayoutedEvent[] {
  return dayAppointments.map((appointment) => {
    const start = new Date(appointment.startsAt);
    const startMinutes =
      start.getHours() * 60 + start.getMinutes() -
      SCHEDULING_CLINIC_START_HOUR * 60;
    const topPx = (startMinutes / 60) * SCHEDULING_PIXELS_PER_HOUR;
    const heightPx = Math.max(
      24,
      (appointment.durationMinutes / 60) * SCHEDULING_PIXELS_PER_HOUR,
    );
    return { appointment, topPx, heightPx };
  });
}

export function snapSlotFromClick(day: Date, offsetY: number) {
  const totalMinutes =
    SCHEDULING_CLINIC_END_HOUR * 60 - SCHEDULING_CLINIC_START_HOUR * 60;
  const clickedMinutes =
    (offsetY / calendarGridHeightPx()) * totalMinutes +
    SCHEDULING_CLINIC_START_HOUR * 60;
  const snapped = Math.round(clickedMinutes / 30) * 30;
  const d = new Date(day);
  d.setHours(Math.floor(snapped / 60), snapped % 60, 0, 0);
  return d.toISOString();
}

export function weekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export function monthMatrix(viewMonth: Date) {
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const start = startOfWeek(first, 0);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function isVisibleOnCalendar(appointment: PracticeAppointment) {
  return !CALENDAR_HIDDEN_STATUSES.has(appointment.status);
}
