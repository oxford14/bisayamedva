import { createClient } from "@/lib/supabase/server";
import { site } from "@/content/site";

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

function formatSession(session: {
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

export async function getFeaturedOffer(): Promise<FeaturedOffer> {
  try {
    const supabase = await createClient();
    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value");

    const map = Object.fromEntries(
      (settings ?? []).map((row) => [row.key, row.value]),
    );
    const courseId = unwrapSetting(map.featured_course_id);
    const sessionId = unwrapSetting(map.next_session_id);

    const [{ data: course }, { data: session }] = await Promise.all([
      courseId
        ? supabase
            .from("courses")
            .select("*")
            .eq("id", courseId)
            .eq("status", "PUBLISHED")
            .maybeSingle()
        : Promise.resolve({ data: null }),
      sessionId
        ? supabase
            .from("sessions")
            .select("*")
            .eq("id", sessionId)
            .eq("status", "PUBLISHED")
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (course && session) {
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
        session: formatSession(session),
        source: "database",
      };
    }
  } catch {
    // Fall through to static content.
  }

  return {
    course: { ...site.featuredCourse },
    session: { ...site.nextSession },
    source: "fallback",
  };
}
