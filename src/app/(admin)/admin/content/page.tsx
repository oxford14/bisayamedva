import { saveContentSettings } from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import {
  ContentSettingsFields,
  type ContentCourseOption,
  type ContentSessionOption,
} from "@/components/admin/content-settings-fields";
import { AdminPageHeader } from "@/components/admin/ui";
import { formatSession } from "@/lib/content/featured-offer";
import { createClient } from "@/lib/supabase/server";

function unwrapSetting(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.replace(/^"|"$/g, "");
  return String(value).replaceAll('"', "");
}

function sessionLabel(session: {
  title: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  format: string;
  status: string;
}) {
  const formatted = formatSession({
    id: "",
    title: session.title,
    starts_at: session.starts_at,
    ends_at: session.ends_at,
    timezone: session.timezone || "Asia/Manila",
    format: session.format || "Online",
    capacity: 0,
  });
  const when = `${formatted.day} · ${formatted.dateLabel} · ${formatted.startTime}–${formatted.endTime} ${formatted.timezoneLabel}`;
  return session.status === "PUBLISHED"
    ? when
    : `${when} (${session.status})`;
}

export default async function ContentPage() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ data: settings }, { data: publishedCourses }, { data: upcomingSessions }] =
    await Promise.all([
      supabase.from("site_settings").select("key, value"),
      supabase
        .from("courses")
        .select("id, title")
        .eq("status", "PUBLISHED")
        .order("sort_order"),
      supabase
        .from("sessions")
        .select("id, title, status, starts_at, ends_at, timezone, format, course_id")
        .eq("status", "PUBLISHED")
        .gte("starts_at", now)
        .order("starts_at", { ascending: true }),
    ]);

  const map = Object.fromEntries(
    (settings ?? []).map((row) => [row.key, row.value]),
  );
  const featured = unwrapSetting(map.featured_course_id);
  const nextSession = unwrapSetting(map.next_session_id);

  const courses: ContentCourseOption[] = [...(publishedCourses ?? [])];
  if (featured && !courses.some((course) => course.id === featured)) {
    const { data: currentCourse } = await supabase
      .from("courses")
      .select("id, title")
      .eq("id", featured)
      .maybeSingle();
    if (currentCourse) courses.unshift(currentCourse);
  }

  const sessionRows = [...(upcomingSessions ?? [])];
  if (nextSession && !sessionRows.some((session) => session.id === nextSession)) {
    const { data: currentSession } = await supabase
      .from("sessions")
      .select("id, title, status, starts_at, ends_at, timezone, format, course_id")
      .eq("id", nextSession)
      .maybeSingle();
    if (currentSession) sessionRows.unshift(currentSession);
  }

  const sessions: ContentSessionOption[] = sessionRows.map((session) => ({
    id: session.id,
    courseId: session.course_id,
    label: sessionLabel(session),
  }));

  return (
    <div>
      <AdminPageHeader
        title="Content"
        description="Choose which published course and session appear on the public site, including registration."
      />

      <div className="max-w-xl rounded-2xl border border-border bg-white p-5">
        <ActionForm action={saveContentSettings} submitLabel="Save content settings">
          <ContentSettingsFields
            courses={courses}
            sessions={sessions}
            featuredCourseId={featured}
            nextSessionId={nextSession}
          />
        </ActionForm>
      </div>
    </div>
  );
}
