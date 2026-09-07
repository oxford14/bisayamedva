import { createServiceClient } from "@/lib/supabase/admin";
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

async function courseCompleteForStudent(studentId: string, courseId: string) {
  const admin = createServiceClient();
  const { data: modules } = await admin
    .from("course_modules")
    .select("id")
    .eq("course_id", courseId)
    .neq("status", "ARCHIVED");
  const moduleIds = (modules ?? []).map((row) => row.id as string);
  if (moduleIds.length === 0) {
    return { complete: false, completedAt: new Date().toISOString() };
  }

  const [{ data: files }, { data: questions }, { data: completions }] =
    await Promise.all([
      admin
        .from("course_module_files")
        .select("id")
        .in("module_id", moduleIds),
      admin
        .from("course_module_quiz_questions")
        .select("module_id")
        .in("module_id", moduleIds),
      admin
        .from("course_module_item_completions")
        .select("item_kind, item_id, completed_at")
        .eq("student_id", studentId)
        .in("module_id", moduleIds),
    ]);

  const quizModules = new Set(
    (questions ?? []).map((row) => row.module_id as string),
  );
  const done = new Set(
    (completions ?? []).map((row) => `${row.item_kind}:${row.item_id}`),
  );
  const required = [
    ...(files ?? []).map((file) => `FILE:${file.id}`),
    ...[...quizModules].map((id) => `QUIZ:${id}`),
  ];
  if (required.length === 0) {
    return { complete: false, completedAt: new Date().toISOString() };
  }

  const complete = required.every((key) => done.has(key));
  const completedAt =
    (completions ?? [])
      .map((row) => row.completed_at as string)
      .sort()
      .at(-1) ?? new Date().toISOString();
  return { complete, completedAt };
}

export async function getPublicCertificateByCode(
  code: string,
): Promise<PublicCertificate | null> {
  const prefix = parseCertificateCode(code);
  if (!prefix) return null;

  const admin = createServiceClient();
  const { data: enrollment } = await admin
    .from("enrollments")
    .select(
      "id, status, student_id, course_id, courses(id, title, subtitle, slug)",
    )
    .like("id", `${prefix}-%`)
    .maybeSingle();

  if (!enrollment) return null;
  if (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED") {
    return null;
  }

  const course = one(
    enrollment.courses as
      | { id: string; title: string; subtitle: string | null; slug: string | null }
      | { id: string; title: string; subtitle: string | null; slug: string | null }[]
      | null,
  );
  if (!course) return null;

  const progress = await courseCompleteForStudent(
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
