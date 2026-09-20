"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminRole, requireStudent } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  canAccessModule7Practical,
  courseHasPracticalExam,
  isPracticalExamModule,
} from "@/lib/member/practical-exam-gate";
import { getCoursePlayerState } from "@/lib/member/module-player";
import {
  ensureCourseEnrollment,
  revalidateCertificatePaths,
} from "@/lib/member/certificates";
import { gradePracticalExam } from "@/lib/practice/practical-exam/grade-practical-exam";
import type {
  PracticalExamPayload,
  PracticalExamSectionScores,
} from "@/lib/practice/practical-exam/types";
import type { UserRole } from "@/lib/supabase/auth";
import { practicalExamCopy } from "@/content/site";

const payloadSchema = z.object({
  registration: z.record(z.string(), z.unknown()),
  scheduling: z.object({
    patientName: z.string(),
    provider: z.string(),
    visitType: z.string(),
    date: z.string(),
    time: z.string(),
    location: z.string(),
  }),
  callMedAdvice: z.string(),
  callUpset: z.string(),
  scenarios: z.record(z.string(), z.string()),
  priorityOrder: z.array(z.string()),
  priorityRationale: z.string(),
  commDelay: z.string(),
  commUnclear: z.string(),
  commUnavailable: z.string(),
  mistakeHandling: z.string(),
});

export type PracticalExamSubmitResult =
  | {
      ok: true;
      score: number;
      maxScore: number;
      passed: boolean;
      criticalError: boolean;
      criticalReasons: string[];
      sectionScores: PracticalExamSectionScores;
      nextHref: string | null;
    }
  | { ok: false; error: string };

async function finishPracticalItem(input: {
  studentId: string;
  courseId: string;
  slug: string;
  role: UserRole;
  email: string;
  staff: boolean;
  moduleId: string;
}) {
  const enrollment = await ensureCourseEnrollment(input.studentId, input.courseId);
  const admin = createServiceClient();
  await admin.from("course_module_item_completions").upsert(
    {
      student_id: input.studentId,
      module_id: input.moduleId,
      item_kind: "PRACTICAL",
      item_id: input.moduleId,
    },
    { onConflict: "student_id,item_kind,item_id", ignoreDuplicates: true },
  );

  const playerRole =
    input.staff && isAdminRole(input.role) ? "STUDENT" : input.role;
  const nextState = await getCoursePlayerState(
    input.studentId,
    input.slug,
    playerRole,
    input.email,
  );
  const currentIndex = nextState.flat.findIndex(
    (entry) => entry.moduleId === input.moduleId && entry.kind === "PRACTICAL",
  );
  const nextHref =
    currentIndex >= 0 ? (nextState.flat[currentIndex + 1]?.href ?? null) : null;

  revalidateCertificatePaths(input.slug);
  revalidatePath(`/member/modules/${input.slug}`);
  revalidatePath(`/member/modules/${input.slug}/${input.moduleId}/practical`);

  return { nextHref, enrollment };
}

export async function submitPracticalExam(
  courseSlug: string,
  moduleId: string,
  raw: unknown,
): Promise<PracticalExamSubmitResult> {
  if (!courseHasPracticalExam(courseSlug)) {
    return { ok: false, error: practicalExamCopy.submitError };
  }

  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: practicalExamCopy.submitIncomplete };
  }

  const profile = await requireStudent();
  if (!canAccessModule7Practical(profile.role)) {
    return { ok: false, error: practicalExamCopy.superAdminOnly };
  }
  const admin = createServiceClient();

  const { data: lesson } = await admin
    .from("course_modules")
    .select("id, title, course_id, courses(slug)")
    .eq("id", moduleId)
    .maybeSingle();
  if (!lesson) return { ok: false, error: practicalExamCopy.submitError };

  const course = Array.isArray(lesson.courses) ? lesson.courses[0] : lesson.courses;
  const slug = (course as { slug?: string } | null)?.slug;
  if (slug !== courseSlug || !isPracticalExamModule(lesson.title as string, slug)) {
    return { ok: false, error: practicalExamCopy.submitError };
  }

  const payload = parsed.data as unknown as PracticalExamPayload;
  const grade = gradePracticalExam(payload);

  const enrollment = await ensureCourseEnrollment(
    profile.id,
    lesson.course_id as string,
  );
  if (!enrollment) {
    return { ok: false, error: practicalExamCopy.submitError };
  }

  const staff = profile.role === "SUPER_ADMIN";
  const writer = staff ? admin : await createClient();
  const { error } = await writer.from("practical_exam_attempts").insert({
    student_id: profile.id,
    module_id: moduleId,
    enrollment_id: enrollment.id,
    score: grade.score,
    max_score: grade.maxScore,
    passed: grade.passed,
    critical_error: grade.criticalError,
    section_scores: grade.sectionScores,
    payload,
  });
  if (error) return { ok: false, error: error.message };

  let nextHref: string | null = null;
  if (grade.passed) {
    const finished = await finishPracticalItem({
      studentId: profile.id,
      courseId: lesson.course_id as string,
      slug: courseSlug,
      role: profile.role,
      email: profile.email,
      staff,
      moduleId,
    });
    nextHref = finished.nextHref;
  } else {
    revalidatePath(`/member/modules/${courseSlug}/${moduleId}/practical`);
  }

  return {
    ok: true,
    score: grade.score,
    maxScore: grade.maxScore,
    passed: grade.passed,
    criticalError: grade.criticalError,
    criticalReasons: grade.criticalReasons,
    sectionScores: grade.sectionScores,
    nextHref,
  };
}
