import { createClient } from "@/lib/supabase/server";
import type {
  OpenFutureSession,
  OpenFutureSessionCourse,
} from "@/lib/member/open-sessions-shared";

export type {
  OpenFutureSession,
  OpenFutureSessionCourse,
} from "@/lib/member/open-sessions-shared";
export {
  courseCheckoutWithSession,
  formatOpenSessionWhen,
} from "@/lib/member/open-sessions-shared";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getOpenFutureSessions(options?: {
  courseId?: string;
  courseSlug?: string;
}): Promise<OpenFutureSession[]> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  let query = supabase
    .from("sessions")
    .select(
      `
      id,
      title,
      starts_at,
      ends_at,
      timezone,
      format,
      meeting_url,
      status,
      course_id,
      courses (
        id,
        title,
        slug,
        price,
        currency,
        status
      )
    `,
    )
    .eq("status", "PUBLISHED")
    .gt("starts_at", nowIso)
    .order("starts_at", { ascending: true });

  if (options?.courseId) {
    query = query.eq("course_id", options.courseId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getOpenFutureSessions", error.message);
    return [];
  }

  const rows: OpenFutureSession[] = [];

  for (const row of data ?? []) {
    const course = one(
      row.courses as OpenFutureSessionCourse | OpenFutureSessionCourse[] | null,
    );
    if (!course || course.status !== "PUBLISHED") continue;
    if (!row.starts_at) continue;
    if (options?.courseSlug && course.slug !== options.courseSlug) continue;

    rows.push({
      id: row.id as string,
      title: row.title as string,
      starts_at: row.starts_at as string,
      ends_at: (row.ends_at as string | null) ?? null,
      timezone: (row.timezone as string | null) ?? null,
      format: (row.format as string | null) ?? null,
      meeting_url: (row.meeting_url as string | null) ?? null,
      status: (row.status as string | null) ?? null,
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        price: course.price,
        currency: course.currency,
        status: course.status,
      },
    });
  }

  return rows;
}
