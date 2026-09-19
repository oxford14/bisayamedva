import { createServiceClient } from "@/lib/supabase/admin";
import { getCertificateCourseCompletion } from "@/lib/member/certificate-completion";
import { certificateCode } from "@/lib/member/certificate-shared";

export type PublicCertificate = {
  certificateId: string;
  studentName: string;
  title: string;
  subtitle: string | null;
  completedAt: string;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function parseCertificateCode(code: string) {
  const match = decodeURIComponent(code)
    .trim()
    .toUpperCase()
    .match(/^BMVA-([0-9A-F]{8})$/);
  return match?.[1]?.toLowerCase() ?? null;
}

function normalizeCertificateCode(code: string) {
  const match = decodeURIComponent(code)
    .trim()
    .toUpperCase()
    .match(/^BMVA-[0-9A-F]{8}$/);
  return match?.[0] ?? null;
}

export async function getPublicCertificateByCode(
  code: string,
): Promise<PublicCertificate | null> {
  const normalized = normalizeCertificateCode(code);
  if (!normalized) return null;

  const admin = createServiceClient();
  const { data: rows, error } = await admin
    .from("enrollments")
    .select(
      "id, status, student_id, course_id, courses(id, title, subtitle, slug)",
    )
    .in("status", ["ACTIVE", "COMPLETED"]);

  if (error) {
    console.error("getPublicCertificateByCode", error.message);
    return null;
  }

  const enrollment = (rows ?? []).find(
    (row) => certificateCode(row.id as string) === normalized,
  );
  if (!enrollment) return null;

  const course = one(
    enrollment.courses as
      | { id: string; title: string; subtitle: string | null; slug: string | null }
      | { id: string; title: string; subtitle: string | null; slug: string | null }[]
      | null,
  );
  if (!course) return null;

  const progress = await getCertificateCourseCompletion(
    enrollment.student_id as string,
    enrollment.course_id as string,
  );
  if (!progress.complete && enrollment.status !== "COMPLETED") return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", enrollment.student_id)
    .maybeSingle();

  return {
    certificateId: certificateCode(enrollment.id as string),
    studentName: (profile?.full_name as string | undefined)?.trim() || "Student",
    title: course.title,
    subtitle: course.subtitle,
    completedAt: progress.completedAt,
  };
}
