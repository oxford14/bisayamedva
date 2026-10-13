import { APP_TIMEZONE, datetimeLocalToIso } from "@/lib/datetime";

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type LiveSessionSchedule = {
  title: string;
  weekday: number;
  /** `HH:mm` wall clock in `timezone`. */
  start_time: string;
  end_time: string;
  timezone: string;
  format: string;
  meeting_url: string | null;
  is_active: boolean;
};

export type PublicLiveSessionSchedule = Omit<LiveSessionSchedule, "meeting_url">;

export const DEFAULT_LIVE_SESSION_SCHEDULE: LiveSessionSchedule = {
  title: "Weekend Live Session",
  weekday: 6,
  start_time: "19:00",
  end_time: "21:00",
  timezone: APP_TIMEZONE,
  format: "Online",
  meeting_url: null,
  is_active: true,
};

/** Postgres `time` comes back as `HH:mm:ss`; the UI and math use `HH:mm`. */
export function toHourMinute(value: string | null | undefined, fallback: string) {
  const match = String(value ?? "").match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : fallback;
}

function wallDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    get("weekday"),
  );
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday,
  };
}

function addDaysToWallDate(
  wall: { year: number; month: number; day: number },
  days: number,
) {
  const shifted = new Date(Date.UTC(wall.year, wall.month - 1, wall.day + days));
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/**
 * Next weekly slot for the schedule. Stays on this week's slot until it ends,
 * so the Join link keeps showing while the session is live.
 */
export function nextOccurrence(
  schedule: Pick<
    LiveSessionSchedule,
    "weekday" | "start_time" | "end_time" | "timezone"
  >,
  now = new Date(),
) {
  const timeZone = schedule.timezone || APP_TIMEZONE;
  const today = wallDateParts(now, timeZone);
  const offset = (schedule.weekday - today.weekday + 7) % 7;

  const build = (days: number) => {
    const date = addDaysToWallDate(today, days);
    return {
      starts_at: datetimeLocalToIso(`${date}T${schedule.start_time}`, timeZone),
      ends_at: datetimeLocalToIso(`${date}T${schedule.end_time}`, timeZone),
    };
  };

  const thisWeek = build(offset);
  if (new Date(thisWeek.ends_at).getTime() > now.getTime()) return thisWeek;
  return build(offset + 7);
}

export function liveSessionSummary(schedule: PublicLiveSessionSchedule) {
  return `Every ${WEEKDAY_LABELS[schedule.weekday] ?? "weekend"}`;
}
