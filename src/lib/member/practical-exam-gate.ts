import { practicalExamCopy } from "@/content/site";
import { isAdminRole, isStudentRole } from "@/lib/supabase/roles";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  practicalItemKey,
  type PlayerOutlineItem,
} from "@/lib/member/module-player-shared";
import type { PracticalExamAttemptSummary } from "@/lib/practice/practical-exam/types";

export const PRACTICAL_EXAM_COURSE_SLUG = "medical-va-masterclass";

export function courseHasPracticalExam(slug: string | null | undefined) {
  return slug === PRACTICAL_EXAM_COURSE_SLUG;
}

export function isPracticalExamModule(title: string, courseSlug: string | null | undefined) {
  return courseHasPracticalExam(courseSlug) && /\bModule 7\b/i.test(title);
}

/** Module 7 / Practical Exam — enrolled students + staff preview roles. */
export function canAccessModule7Practical(role: string | null | undefined) {
  return (
    role === "SUPER_ADMIN" || isStudentRole(role) || isAdminRole(role)
  );
}

export function buildPracticalOutlineItem(
  courseSlug: string,
  moduleId: string,
  passed: boolean,
): PlayerOutlineItem {
  return {
    key: practicalItemKey(),
    kind: "PRACTICAL",
    moduleId,
    itemId: moduleId,
    title: practicalExamCopy.outlineItemTitle,
    label: "Practical",
    complete: passed,
    locked: false,
    href: `/member/modules/${courseSlug}/${moduleId}/${practicalItemKey()}`,
  };
}

export async function fetchLatestPracticalAttempt(
  admin: SupabaseClient,
  studentId: string,
  moduleId: string,
): Promise<PracticalExamAttemptSummary | null> {
  const { data } = await admin
    .from("practical_exam_attempts")
    .select("score, max_score, passed, critical_error, section_scores, submitted_at")
    .eq("student_id", studentId)
    .eq("module_id", moduleId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    score: Number(data.score),
    maxScore: Number(data.max_score),
    passed: Boolean(data.passed),
    criticalError: Boolean(data.critical_error),
    sectionScores: (data.section_scores ?? {}) as PracticalExamAttemptSummary["sectionScores"],
    submittedAt: data.submitted_at as string,
  };
}

export async function fetchPracticalModuleIdsForCourse(
  admin: SupabaseClient,
  courseId: string,
  courseSlug: string,
): Promise<string[]> {
  if (!courseHasPracticalExam(courseSlug)) return [];
  const { data } = await admin
    .from("course_modules")
    .select("id, title")
    .eq("course_id", courseId)
    .eq("status", "PUBLISHED");
  return (data ?? [])
    .filter((row) => isPracticalExamModule(row.title as string, courseSlug))
    .map((row) => row.id as string);
}
