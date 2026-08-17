import { createClient } from "@/lib/supabase/server";
import { upsertSession } from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import {
  AdminPageHeader,
  AdminTable,
  EmptyState,
  StatusBadge,
} from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";

export default async function SessionsPage() {
  const supabase = await createClient();
  const [{ data: sessions }, { data: courses }] = await Promise.all([
    supabase
      .from("sessions")
      .select("*, courses(title)")
      .order("starts_at", { ascending: true }),
    supabase.from("courses").select("id, title").order("title"),
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

  return (
    <div>
      <AdminPageHeader
        title="Sessions"
        description="Weekend cohorts, capacity, schedule, and meeting links."
      />

      <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
        {(sessions ?? []).length === 0 ? (
          <EmptyState
            title="No sessions"
            body="Create a published session so students can enroll."
          />
        ) : (
          <AdminTable
            headers={["Session", "Course", "Schedule", "Capacity", "Status"]}
          >
            {(sessions ?? []).map((session) => {
              const course = Array.isArray(session.courses)
                ? session.courses[0]
                : session.courses;
              const enrolled = enrollmentCounts.get(session.id) ?? 0;
              return (
                <tr key={session.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{session.title}</div>
                    <div className="text-xs text-muted">{session.format}</div>
                  </td>
                  <td className="px-4 py-3">{course?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      {new Date(session.starts_at).toLocaleString("en-PH", {
                        timeZone: session.timezone,
                      })}
                    </div>
                    <div className="text-xs text-muted">
                      to{" "}
                      {new Date(session.ends_at).toLocaleTimeString("en-PH", {
                        timeZone: session.timezone,
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {enrolled}/{session.capacity}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={session.status} />
                  </td>
                </tr>
              );
            })}
          </AdminTable>
        )}

        <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="font-semibold">Create session</h2>
          <p className="mt-1 text-sm text-muted">
            Session ID is generated automatically when you save.
          </p>
          <ActionForm action={upsertSession} className="mt-4 space-y-3" submitLabel="Save session">
            <Field label="Course" htmlFor="course_id">
              <select
                id="course_id"
                name="course_id"
                required
                className="flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5"
                defaultValue={courses?.[0]?.id}
              >
                {(courses ?? []).map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title" htmlFor="title">
              <Input id="title" name="title" required defaultValue="NEXT WEEKEND TRAINING" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Starts at" htmlFor="starts_at">
                <Input id="starts_at" name="starts_at" type="datetime-local" required />
              </Field>
              <Field label="Ends at" htmlFor="ends_at">
                <Input id="ends_at" name="ends_at" type="datetime-local" required />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Capacity" htmlFor="capacity">
                <Input id="capacity" name="capacity" type="number" min="1" defaultValue="30" required />
              </Field>
              <Field label="Status" htmlFor="status">
                <select
                  id="status"
                  name="status"
                  className="flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5"
                  defaultValue="DRAFT"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </Field>
            </div>
            <Field
              label="Meeting URL"
              htmlFor="meeting_url"
              hint="Optional. Add the Zoom or Meet link when ready."
            >
              <Input
                id="meeting_url"
                name="meeting_url"
                type="text"
                inputMode="url"
                placeholder="https://…"
                autoComplete="off"
              />
            </Field>
            <input type="hidden" name="timezone" value="Asia/Manila" />
            <input type="hidden" name="format" value="Online" />
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
