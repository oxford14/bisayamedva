import { createClient } from "@/lib/supabase/server";
import { expireStalePendingPayments } from "@/lib/payments/expire-pending";
import {
  AdminPageHeader,
  EmptyState,
} from "@/components/admin/ui";
import {
  SessionManager,
  type SessionManagerRow,
  type SessionRosterStudent,
} from "@/components/admin/session-manager";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function SessionsPage() {
  await expireStalePendingPayments();
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
          .select("session_id, status, profiles(full_name, email)")
          .in("session_id", sessionIds)
          .neq("status", "CANCELLED")
      : {
          data: [] as {
            session_id: string;
            status: string;
            profiles:
              | { full_name: string | null; email: string | null }
              | { full_name: string | null; email: string | null }[]
              | null;
          }[],
        };

  const rosters: Record<string, SessionRosterStudent[]> = {};
  for (const row of enrollmentRows ?? []) {
    if (!row.session_id) continue;
    const profile = one(
      row.profiles as
        | { full_name: string | null; email: string | null }
        | { full_name: string | null; email: string | null }[]
        | null,
    );
    const list = rosters[row.session_id] ?? [];
    list.push({
      fullName: profile?.full_name?.trim() || "Unnamed student",
      email: profile?.email?.trim() || "—",
      status: row.status,
    });
    rosters[row.session_id] = list;
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
      enrolled: rosters[session.id]?.length ?? 0,
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
          rosters={rosters}
        />
      )}
    </div>
  );
}
