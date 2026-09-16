import {
  AdminTable,
  EmptyState,
  StatusBadge,
} from "@/components/admin/ui";
import type { StudentCourseProgressSummary } from "@/lib/admin/student-progress";

function moduleStatusLabel(status: string) {
  return status.replaceAll("_", " ").toUpperCase();
}

export function StudentProgressSummary({
  courses,
}: {
  courses: StudentCourseProgressSummary[];
}) {
  if (courses.length === 0) {
    return (
      <EmptyState
        title="No module progress"
        body="This student has no active or completed enrollments with module access."
      />
    );
  }

  return (
    <div className="space-y-6">
      {courses.map((course) => (
        <div
          key={course.enrollmentId}
          className="rounded-2xl border border-border bg-white p-4"
        >
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-ink">{course.courseTitle}</h3>
              <p className="mt-1 text-sm text-muted">
                {course.completedModuleCount}/{course.totalModuleCount} modules
                complete
                {!course.modulesUnlocked && course.unlockLabel
                  ? ` · Locked until ${course.unlockLabel}`
                  : course.modulesUnlocked && course.courseComplete
                    ? " · Course complete"
                    : course.modulesUnlocked && course.currentModuleTitle
                      ? ` · Current: ${course.currentModuleTitle}`
                      : null}
              </p>
            </div>
            <StatusBadge status={course.enrollmentStatus} />
          </div>

          {course.modules.length === 0 ? (
            <p className="text-sm text-muted">No published modules yet.</p>
          ) : (
            <AdminTable headers={["#", "Module", "Status"]}>
              {course.modules.map((mod, index) => (
                <tr key={mod.id}>
                  <td className="px-4 py-2.5 text-muted">{index + 1}</td>
                  <td className="px-4 py-2.5">{mod.title}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={moduleStatusLabel(mod.status)} />
                  </td>
                </tr>
              ))}
            </AdminTable>
          )}
        </div>
      ))}
    </div>
  );
}
