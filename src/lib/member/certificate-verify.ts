import { courseRequiresHipaaGate } from "@/lib/member/hipaa-gate";
import { getPublicPortfolioSlugForStudent } from "@/lib/member/portfolio/public";
import { getCertificateCourseCompletion } from "@/lib/member/certificate-completion";
import { certificateCode } from "@/lib/member/certificate-shared";
import { createServiceClient } from "@/lib/supabase/admin";

export type PublicCertificate = {
  certificateId: string;
  studentName: string;
  title: string;
  subtitle: string | null;
  completedAt: string;
};

export type CertificateVerifyContext = PublicCertificate & {
  publicPortfolioSlug: string | null;
  hipaaApproved: boolean;
};

export type VerifiedEnrollment = {
  enrollmentId: string;
  studentId: string;
  courseId: string;
  course: {
    id: string;
    title: string;
    subtitle: string | null;
    slug: string | null;
  };
  completedAt: string;
  studentName: string;
  certificateId: string;
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

/** Shared verification path for display, portfolio link, and HIPAA signed URLs. */
export async function resolveVerifiedEnrollmentFromCode(
  code: string,
): Promise<VerifiedEnrollment | null> {
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
    console.error("resolveVerifiedEnrollmentFromCode", error.message);
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
    enrollmentId: enrollment.id as string,
    studentId: enrollment.student_id as string,
    courseId: enrollment.course_id as string,
    course,
    completedAt: progress.completedAt,
    studentName:
      (profile?.full_name as string | undefined)?.trim() || "Student",
    certificateId: certificateCode(enrollment.id as string),
  };
}

async function isHipaaApprovedForEnrollment(
  studentId: string,
  courseId: string,
  courseSlug: string | null,
): Promise<boolean> {
  if (!courseRequiresHipaaGate(courseSlug)) return false;

  const admin = createServiceClient();
  const { data: row } = await admin
    .from("hipaa_certificate_submissions")
    .select("status")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .maybeSingle();

  return row?.status === "APPROVED";
}

export async function getApprovedHipaaFileForVerifiedEnrollment(
  verified: VerifiedEnrollment,
): Promise<{
  storagePath: string;
  fileName: string;
  mimeType: string;
} | null> {
  if (!courseRequiresHipaaGate(verified.course.slug)) return null;

  const admin = createServiceClient();
  const { data: row } = await admin
    .from("hipaa_certificate_submissions")
    .select("storage_path, file_name, mime_type, status")
    .eq("student_id", verified.studentId)
    .eq("course_id", verified.courseId)
    .maybeSingle();

  if (row?.status !== "APPROVED" || !row.storage_path) return null;

  return {
    storagePath: row.storage_path as string,
    fileName: row.file_name as string,
    mimeType: row.mime_type as string,
  };
}

export async function getPublicCertificateVerifyContext(
  code: string,
): Promise<CertificateVerifyContext | null> {
  const verified = await resolveVerifiedEnrollmentFromCode(code);
  if (!verified) return null;

  const admin = createServiceClient();
  const [publicPortfolioSlug, hipaaApproved] = await Promise.all([
    getPublicPortfolioSlugForStudent(admin, verified.studentId),
    isHipaaApprovedForEnrollment(
      verified.studentId,
      verified.courseId,
      verified.course.slug,
    ),
  ]);

  return {
    certificateId: verified.certificateId,
    studentName: verified.studentName,
    title: verified.course.title,
    subtitle: verified.course.subtitle,
    completedAt: verified.completedAt,
    publicPortfolioSlug,
    hipaaApproved,
  };
}

export async function getPublicCertificateByCode(
  code: string,
): Promise<PublicCertificate | null> {
  const context = await getPublicCertificateVerifyContext(code);
  if (!context) return null;

  const { publicPortfolioSlug: _slug, hipaaApproved: _hipaa, ...certificate } =
    context;
  return certificate;
}
