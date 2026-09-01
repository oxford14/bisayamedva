import { createClient } from "@/lib/supabase/server";
import {
  AdminPageHeader,
  EmptyState,
} from "@/components/admin/ui";
import {
  SessionManager,
  type SessionManagerRow,
} from "@/components/admin/session-manager";

export default async function SessionsPage() {
  const supabase = await createClient();
  const [{ data: sessions }, { data: courses }] = await Promise.all([
    supabase
      .from("sessions")
      .select("*, courses(title)")
      .order("starts_at", { ascending: true }),
    supabase
      .from("courses")
      .select("id, title")
      .neq("status", "ARCHIVED")
      .order("title"),
  ]);

  const sessionIds = (sessions ?? []).map((session) => session.id);
  const { data: enrollmentRows } =
    sessionIds.length > 0
      ? await supabase
          .from("enrollments")
          .select("session_id")
          .in("session_id", sessionIds)
          .neq("status", "CANCELLED")
      : { data: [] as { session_id: string }[] };

  const enrollmentCounts = new Map<string, number>();
  for (const row of enrollmentRows ?? []) {
    enrollmentCounts.set(
      row.session_id,
      (enrollmentCounts.get(row.session_id) ?? 0) + 1,
    );
  }

  const rows: SessionManagerRow[] = (sessions ?? []).map((session) => {
    const course = Array.isArray(session.courses)
      ? session.courses[0]
      : session.courses;
    return {
      id: session.id,
      course_id: session.course_id,
      title: session.title,
      starts_at: session.starts_at,
      ends_at: session.ends_at,
      timezone: session.timezone,
      format: session.format,
      capacity: session.capacity,
      meeting_url: session.meeting_url,
      status: session.status,
      courseTitle: course?.title ?? "—",
      enrolled: enrollmentCounts.get(session.id) ?? 0,
    };
  });

  return (
    <div>
      <AdminPageHeader
        title="Sessions"
        description="Weekend cohorts, capacity, schedule, and meeting links."
      />

      {(courses ?? []).length === 0 ? (
        <EmptyState
          title="No courses available"
          body="Create a course first before scheduling sessions."
        />
      ) : (
        <SessionManager
          sessions={rows}
          courses={(courses ?? []).map((course) => ({
            id: course.id,
            title: course.title,
          }))}
        />
      )}
    </div>
  );
}
