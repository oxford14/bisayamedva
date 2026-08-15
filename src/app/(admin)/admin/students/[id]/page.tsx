import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  AdminPageHeader,
  AdminTable,
  EmptyState,
  StatusBadge,
} from "@/components/admin/ui";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!student) notFound();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "id, status, created_at, notes, courses(title), sessions(title, starts_at)",
    )
    .eq("student_id", id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <AdminPageHeader
        title={student.full_name}
        description={student.email}
        actions={
          <Link href="/admin/students" className="text-sm font-medium text-teal">
            Back to students
          </Link>
        }
      />

      <div className="grid gap-4 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Role</p>
          <div className="mt-1">
            <StatusBadge status={student.role} />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Mobile</p>
          <p className="mt-1">{student.mobile ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Occupation</p>
          <p className="mt-1">{student.occupation ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Experience</p>
          <p className="mt-1">{student.experience_level ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Messenger</p>
          <p className="mt-1">{student.messenger_handle ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Referral</p>
          <p className="mt-1">{student.referral_source ?? "—"}</p>
        </div>
      </div>

      <h2 className="mt-8 mb-3 font-semibold">Enrollment history</h2>
      {(enrollments ?? []).length === 0 ? (
        <EmptyState
          title="No enrollments"
          body="This student has not been enrolled in a session yet."
        />
      ) : (
        <AdminTable headers={["Course", "Session", "Status", "Created"]}>
          {(enrollments ?? []).map((row) => {
            const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
            const session = Array.isArray(row.sessions)
              ? row.sessions[0]
              : row.sessions;
            return (
              <tr key={row.id}>
                <td className="px-4 py-3">{course?.title ?? "—"}</td>
                <td className="px-4 py-3">
                  <div>{session?.title ?? "—"}</div>
                  <div className="text-xs text-muted">
                    {session?.starts_at
                      ? new Date(session.starts_at).toLocaleString()
                      : ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(row.created_at).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </AdminTable>
      )}
    </div>
  );
}
