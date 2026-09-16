import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listStudentProgressRows } from "@/lib/admin/student-progress";
import {
  AdminPageHeader,
  AdminTable,
  EmptyState,
  StatusBadge,
} from "@/components/admin/ui";

function progressHref(params: {
  q?: string;
  course?: string;
  status?: string;
}) {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.course?.trim()) search.set("course", params.course.trim());
  if (params.status?.trim() && params.status !== "ALL") {
    search.set("status", params.status.trim());
  }
  const qs = search.toString();
  return qs ? `/admin/progress?${qs}` : "/admin/progress";
}

function userViewHref(studentId: string, q?: string) {
  const params = new URLSearchParams();
  params.set("view", studentId);
  if (q?.trim()) params.set("q", q.trim());
  return `/admin/users?${params.toString()}`;
}

export default async function AdminProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; course?: string; status?: string }>;
}) {
  const { q, course, status } = await searchParams;
  const supabase = await createClient();

  const [{ data: courses }, rows] = await Promise.all([
    supabase.from("courses").select("id, title").order("title"),
    listStudentProgressRows({
      q,
      courseId: course,
      enrollmentStatus: status,
    }),
  ]);

  const statusFilter = status ?? "ALL";

  return (
    <div>
      <AdminPageHeader
        title="Student progress"
        description="Module completion by course — see who is locked, in progress, or finished."
      />

      <form className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[12rem] flex-1">
          <label className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
            Search
          </label>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Name or email"
            className="h-11 w-full max-w-md rounded-[10px] border border-border bg-white px-3.5 text-sm"
          />
        </div>
        <div className="min-w-[12rem]">
          <label className="mb-1 block text-xs font-semibold tracking-wide text-muted uppercase">
            Course
          </label>
          <select
            name="course"
            defaultValue={course ?? ""}
            className="h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm"
          >
            <option value="">All courses</option>
            {(courses ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <input type="hidden" name="status" value={statusFilter} />
        <button
          type="submit"
          className="h-11 rounded-[10px] bg-navy px-4 text-sm font-semibold text-white"
        >
          Apply
        </button>
      </form>

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { value: "ALL", label: "All statuses" },
          { value: "ACTIVE", label: "Active" },
          { value: "COMPLETED", label: "Completed" },
        ].map(({ value, label }) => (
          <Link
            key={value}
            href={progressHref({ q, course, status: value })}
            className={`rounded-full border border-border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase ${
              statusFilter === value
                ? "bg-navy text-white"
                : "bg-white text-navy/70 hover:bg-sand"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No progress records"
          body="No active or completed enrollments match your filters."
        />
      ) : (
        <AdminTable
          headers={[
            "Student",
            "Course",
            "Enrollment",
            "Access",
            "Progress",
            "",
          ]}
        >
          {rows.map((row) => (
            <tr key={`${row.studentId}-${row.courseId}`}>
              <td className="px-4 py-3">
                <div className="font-medium">{row.studentName}</div>
                <div className="text-xs text-muted">{row.studentEmail}</div>
              </td>
              <td className="px-4 py-3">{row.courseTitle}</td>
              <td className="px-4 py-3">
                <StatusBadge status={row.enrollmentStatus} />
              </td>
              <td className="px-4 py-3 text-sm">
                {row.modulesUnlocked ? (
                  <span className="font-medium text-navy">Open</span>
                ) : (
                  <div>
                    <span className="font-medium text-navy/80">Locked</span>
                    {row.unlockLabel ? (
                      <div className="text-xs text-muted">
                        until {row.unlockLabel}
                      </div>
                    ) : null}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium">
                  {row.completedModuleCount}/{row.totalModuleCount} modules
                </div>
                <div className="text-xs text-muted">
                  {!row.modulesUnlocked
                    ? "Modules locked"
                    : row.courseComplete
                      ? "Course complete"
                      : row.currentModuleTitle
                        ? `Current: ${row.currentModuleTitle}`
                        : row.totalModuleCount === 0
                          ? "No published modules"
                          : "Not started"}
                </div>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={userViewHref(row.studentId, q)}
                  className="text-sm font-semibold text-navy hover:underline"
                >
                  View user
                </Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
