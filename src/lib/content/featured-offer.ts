import { createClient } from "@/lib/supabase/server";
import { site } from "@/content/site";
import {
  DEFAULT_LIVE_SESSION_SCHEDULE,
  nextOccurrence,
} from "@/lib/live-session/schedule-shared";
import { getPublicLiveSessionSchedule } from "@/lib/live-session/schedule";

export type FeaturedOffer = {
  course: {
    id: string;
    name: string;
    subtitle: string;
    type: "BASIC" | "UPSKILL";
    price: number;
    currency: "PHP";
    priceLabel: string;
  };
  session: {
    id: string;
    label: string;
    day: string;
    dateLabel: string;
    startTime: string;
    endTime: string;
    timezone: string;
    timezoneLabel: string;
    format: string;
    capacity: number;
  };
  source: "database" | "fallback";
};

function unwrapSetting(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value.replace(/^"|"$/g, "");
  return String(value);
}

export function formatSession(session: {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  format: string;
  capacity: number;
}) {
  const start = new Date(session.starts_at);
  const end = new Date(session.ends_at);
  const day = new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    timeZone: session.timezone,
  }).format(start);
  const dateLabel = new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: session.timezone,
  }).format(start);
  const startTime = new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: session.timezone,
  }).format(start);
  const endTime = new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: session.timezone,
  }).format(end);

  return {
    id: session.id,
    label: session.title,
    day,
    dateLabel,
    startTime,
    endTime,
    timezone: session.timezone,
    timezoneLabel: session.timezone === "Asia/Manila" ? "PHT" : session.timezone,
    format: session.format,
    capacity: session.capacity,
  };
}

/** The recurring weekend live session, as its next upcoming slot. */
async function getNextLiveSession(): Promise<FeaturedOffer["session"]> {
  // Missing row → default weekly slot, so the date never goes stale.
  const schedule =
    (await getPublicLiveSessionSchedule()) ?? DEFAULT_LIVE_SESSION_SCHEDULE;
  const { starts_at, ends_at } = nextOccurrence(schedule);
  return formatSession({
    id: "weekend-live-session",
    title: schedule.title,
    starts_at,
    ends_at,
    timezone: schedule.timezone,
    format: schedule.format,
    capacity: site.nextSession.capacity,
  });
}

export async function getFeaturedOffer(): Promise<FeaturedOffer> {
  const session = await getNextLiveSession();
  try {
    const supabase = await createClient();
    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value");

    const map = Object.fromEntries(
      (settings ?? []).map((row) => [row.key, row.value]),
    );
    const courseId = unwrapSetting(map.featured_course_id);

    const { data: course } = courseId
      ? await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .eq("status", "PUBLISHED")
          .maybeSingle()
      : { data: null };

    if (course) {
      return {
        course: {
          id: course.id,
          name: course.title,
          subtitle: course.subtitle ?? "",
          type: course.course_type,
          price: Number(course.price),
          currency: "PHP",
          priceLabel: site.featuredCourse.priceLabel,
        },
        session,
        source: "database",
      };
    }
  } catch {
    // Fall through to static content.
  }

  return {
    course: { ...site.featuredCourse },
    session,
    source: "fallback",
  };
}
