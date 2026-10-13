import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { OpenFutureSession } from "@/lib/member/open-sessions-shared";
import {
  DEFAULT_LIVE_SESSION_SCHEDULE,
  nextOccurrence,
  toHourMinute,
  type LiveSessionSchedule,
  type PublicLiveSessionSchedule,
} from "@/lib/live-session/schedule-shared";

export const LIVE_SESSION_ID = "weekend-live-session";

const COLUMNS =
  "title, weekday, start_time, end_time, timezone, format, meeting_url, is_active";

function normalize(row: Record<string, unknown> | null): LiveSessionSchedule {
  const d = DEFAULT_LIVE_SESSION_SCHEDULE;
  if (!row) return { ...d };
  const weekday = Number(row.weekday);
  return {
    title: String(row.title ?? d.title),
    weekday: Number.isInteger(weekday) && weekday >= 0 && weekday <= 6 ? weekday : d.weekday,
    start_time: toHourMinute(row.start_time as string, d.start_time),
    end_time: toHourMinute(row.end_time as string, d.end_time),
    timezone: String(row.timezone ?? d.timezone),
    format: String(row.format ?? d.format),
    meeting_url: (row.meeting_url as string | null) || null,
    is_active: row.is_active !== false,
  };
}

/** Logged-in members and admins (RLS: authenticated read). Includes the Zoom link. */
export async function getLiveSessionSchedule(): Promise<LiveSessionSchedule> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("live_session_schedule")
    .select(COLUMNS)
    .maybeSingle();
  if (error) console.error("getLiveSessionSchedule", error.message);
  return normalize(data);
}

/** Public pages (marketing, register). Never returns the meeting link. */
export async function getPublicLiveSessionSchedule(): Promise<PublicLiveSessionSchedule | null> {
  try {
    const admin = createServiceClient();
    const { data, error } = await admin
      .from("live_session_schedule")
      .select(COLUMNS)
      .maybeSingle();
    if (error || !data) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { meeting_url, ...rest } = normalize(data);
    return rest;
  } catch {
    return null;
  }
}

/** Shape the recurring slot like a session row so existing cards render it. */
export function liveSessionAsSession(
  schedule: LiveSessionSchedule,
  now = new Date(),
): OpenFutureSession {
  const { starts_at, ends_at } = nextOccurrence(schedule, now);
  return {
    id: LIVE_SESSION_ID,
    title: schedule.title,
    starts_at,
    ends_at,
    timezone: schedule.timezone,
    format: schedule.format,
    meeting_url: schedule.meeting_url,
    status: schedule.is_active ? "PUBLISHED" : "DRAFT",
    course: {
      id: LIVE_SESSION_ID,
      title: "Free for all students",
      slug: null,
      price: null,
      currency: null,
      status: "PUBLISHED",
    },
  };
}
