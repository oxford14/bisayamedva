import { createServiceClient } from "@/lib/supabase/admin";
import { HipaaReviewForm } from "@/components/admin/hipaa-review-form";
import { HipaaViewFileButton } from "@/components/admin/hipaa-view-file-button";
import {
  AdminPageHeader,
  AdminTable,
  EmptyState,
  StatusBadge,
} from "@/components/admin/ui";
import { hipaaCopy } from "@/content/site";

export const dynamic = "force-dynamic";

const QUALIFYING_ENROLLMENT = new Set(["ACTIVE", "COMPLETED"]);

function enrollmentKey(studentId: string, courseId: string) {
  return `${studentId}:${courseId}`;
}

export default async function AdminHipaaCertificatesPage() {
  const admin = createServiceClient();
  const { data: rows, error } = await admin
    .from("hipaa_certificate_submissions")
    .select(
      "id, status, file_name, mime_type, submitted_at, review_note, student_id, course_id, student:profiles!hipaa_certificate_submissions_student_id_fkey(full_name, email), courses(title, slug)",
    )
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("AdminHipaaCertificatesPage", error.message);
    return (
      <div>
        <AdminPageHeader
          title={hipaaCopy.adminTitle}
          description={hipaaCopy.adminDescription}
        />
        <EmptyState title={hipaaCopy.adminLoadErrorTitle} body={hipaaCopy.adminLoadErrorBody} />
      </div>
    );
  }

  const list = rows ?? [];
  const enrolledKeys = new Set<string>();

  if (list.length > 0) {
    const studentIds = [...new Set(list.map((row) => row.student_id as string))];
    const courseIds = [...new Set(list.map((row) => row.course_id as string))];
    const { data: enrollments } = await admin
      .from("enrollments")
      .select("student_id, course_id, status")
      .in("student_id", studentIds)
      .in("course_id", courseIds)
      .in("status", ["ACTIVE", "COMPLETED"]);

    for (const enrollment of enrollments ?? []) {
      if (QUALIFYING_ENROLLMENT.has(enrollment.status as string)) {
        enrolledKeys.add(
          enrollmentKey(
            enrollment.student_id as string,
            enrollment.course_id as string,
          ),
        );
      }
    }
  }

  return (
    <div>
      <AdminPageHeader
        title={hipaaCopy.adminTitle}
        description={hipaaCopy.adminDescription}
      />

      {list.length === 0 ? (
        <EmptyState title={hipaaCopy.adminEmpty} body="" />
      ) : (
        <AdminTable
          headers={["Student", "Course", "File", "Status", "Submitted", "Review"]}
        >
          {list.map((row) => {
            const profile = Array.isArray(row.student) ? row.student[0] : row.student;
            const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
            const studentId = row.student_id as string;
            const courseId = row.course_id as string;
            const staffPreviewOnly = !enrolledKeys.has(enrollmentKey(studentId, courseId));

            return (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{profile?.full_name ?? "—"}</div>
                  <div className="text-xs text-muted">{profile?.email ?? ""}</div>
                  {staffPreviewOnly ? (
                    <span className="mt-1.5 inline-flex rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-navy uppercase">
                      {hipaaCopy.adminStaffPreviewBadge}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">{course?.title ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="text-sm">{row.file_name as string}</div>
                  <div className="text-xs text-muted">{row.mime_type as string}</div>
                  <div className="mt-2">
                    <HipaaViewFileButton submissionId={row.id as string} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status as string} />
                </td>
                <td className="px-4 py-3 text-sm text-muted">
                  {new Date(row.submitted_at as string).toLocaleString("en-PH", {
                    timeZone: "Asia/Manila",
                  })}
                </td>
                <td className="px-4 py-3">
                  {row.status === "PENDING" ? (
                    <HipaaReviewForm id={row.id as string} />
                  ) : (
                    <div className="text-xs text-muted">
                      {row.review_note ? `Note: ${row.review_note}` : "—"}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </AdminTable>
      )}
    </div>
  );
}
