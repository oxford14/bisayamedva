import { createClient } from "@/lib/supabase/server";
import {
  createEnrollment,
  updateEnrollmentStatus,
} from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import {
  AdminPageHeader,
  AdminTable,
  EmptyState,
  StatusBadge,
} from "@/components/admin/ui";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let enrollmentsQuery = supabase
    .from("enrollments")
    .select(
      "id, status, created_at, notes, profiles(full_name, email), courses(title), sessions(title)",
    )
    .order("created_at", { ascending: false });
  if (status) enrollmentsQuery = enrollmentsQuery.eq("status", status);

  const [{ data: enrollments }, { data: students }, { data: courses }, { data: sessions }] =
    await Promise.all([
      enrollmentsQuery,
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "STUDENT")
        .order("full_name"),
      supabase.from("courses").select("id, title").order("title"),
      supabase
        .from("sessions")
        .select("id, title, course_id")
        .order("starts_at", { ascending: false }),
    ]);

  return (
    <div>
      <AdminPageHeader
        title="Enrollments"
        description="Link students to course sessions and manage activation."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {["", "PENDING_PAYMENT", "ACTIVE", "CANCELLED", "COMPLETED"].map((value) => (
          <a
            key={value || "all"}
            href={value ? `/admin/enrollments?status=${value}` : "/admin/enrollments"}
            className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold tracking-wide uppercase text-navy/70 hover:bg-sand"
          >
            {value ? value.replaceAll("_", " ") : "All"}
          </a>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        {(enrollments ?? []).length === 0 ? (
          <EmptyState
            title="No enrollments"
            body="Create an enrollment to generate a pending payment record."
          />
        ) : (
          <AdminTable headers={["Student", "Course / Session", "Status", "Actions"]}>
            {(enrollments ?? []).map((row) => {
              const profile = Array.isArray(row.profiles)
                ? row.profiles[0]
                : row.profiles;
              const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
              const session = Array.isArray(row.sessions)
                ? row.sessions[0]
                : row.sessions;
              return (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{profile?.full_name}</div>
                    <div className="text-xs text-muted">{profile?.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{course?.title}</div>
                    <div className="text-xs text-muted">{session?.title}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <ActionForm
                      action={updateEnrollmentStatus}
                      submitLabel="Update"
                      className="flex flex-wrap items-end gap-2"
                    >
                      <input type="hidden" name="id" value={row.id} />
                      <select
                        name="status"
                        defaultValue={row.status}
                        className="h-10 rounded-[10px] border border-border bg-white px-2 text-xs"
                      >
                        <option value="PENDING_PAYMENT">PENDING PAYMENT</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                      <Input
                        name="notes"
                        placeholder="Override note"
                        className="h-10 min-w-[10rem] text-xs"
                      />
                    </ActionForm>
                  </td>
                </tr>
              );
            })}
          </AdminTable>
        )}

        <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="font-semibold">Create enrollment</h2>
          <ActionForm
            action={createEnrollment}
            className="mt-4 space-y-3"
            submitLabel="Create enrollment"
          >
            <Field label="Student" htmlFor="student_id">
              <select
                id="student_id"
                name="student_id"
                required
                className="flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5"
              >
                <option value="">Select student</option>
                {(students ?? []).map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} ({student.email})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Course" htmlFor="course_id">
              <select
                id="course_id"
                name="course_id"
                required
                className="flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5"
              >
                {(courses ?? []).map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Session" htmlFor="session_id">
              <select
                id="session_id"
                name="session_id"
                required
                className="flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5"
              >
                {(sessions ?? []).map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title}
                  </option>
                ))}
              </select>
            </Field>
            <input type="hidden" name="status" value="PENDING_PAYMENT" />
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
