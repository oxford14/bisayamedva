import { createServiceClient } from "@/lib/supabase/admin";
import {
  courseRequiresHipaaGate,
  fetchHipaaSubmission,
} from "@/lib/member/hipaa-gate";
import {
  canAccessModule7Practical,
  fetchPracticalModuleIdsForCourse,
} from "@/lib/member/practical-exam-gate";
import {
  buildDoneItemKeys,
  type AttemptRow,
  type CompletionRow,
  type PracticalAttemptRow,
} from "@/lib/member/module-item-progress";

export type CertificateCompletionResult = {
  complete: boolean;
  completedAt: string;
};

/** Matches student certificate issuance: PUBLISHED modules, files + quizzes, attempts or completions. */
export async function getCertificateCourseCompletion(
  studentId: string,
  courseId: string,
): Promise<CertificateCompletionResult> {
  const admin = createServiceClient();
  const { data: courseRow } = await admin
    .from("courses")
    .select("slug")
    .eq("id", courseId)
    .maybeSingle();
  const { data: modules } = await admin
    .from("course_modules")
    .select("id")
    .eq("course_id", courseId)
    .eq("status", "PUBLISHED");

  const moduleIds = (modules ?? []).map((row) => row.id as string);
  if (moduleIds.length === 0) {
    return { complete: false, completedAt: new Date().toISOString() };
  }

  let practicalModuleIds = await fetchPracticalModuleIdsForCourse(
    admin,
    courseId,
    courseRow?.slug as string,
  );
  const { data: profileRow } = await admin
    .from("profiles")
    .select("role")
    .eq("id", studentId)
    .maybeSingle();
  if (!canAccessModule7Practical(profileRow?.role as string | undefined)) {
    practicalModuleIds = [];
  }

  const [{ data: files }, { data: questions }, { data: completions }, { data: attempts }, { data: practicalAttempts }] =
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
      admin
        .from("course_module_quiz_attempts")
        .select("module_id, score, total, submitted_at")
        .eq("student_id", studentId)
        .in("module_id", moduleIds),
      practicalModuleIds.length
        ? admin
            .from("practical_exam_attempts")
            .select("module_id, passed, submitted_at")
            .eq("student_id", studentId)
            .in("module_id", practicalModuleIds)
            .order("submitted_at", { ascending: false })
        : Promise.resolve({ data: [] as never[] }),
    ]);

  const quizModules = new Set(
    (questions ?? []).map((row) => row.module_id as string),
  );
  const latestPracticalByModule = new Map<string, PracticalAttemptRow>();
  for (const row of practicalAttempts ?? []) {
    const mid = row.module_id as string;
    if (!latestPracticalByModule.has(mid)) {
      latestPracticalByModule.set(mid, {
        module_id: mid,
        passed: Boolean(row.passed),
        submitted_at: row.submitted_at as string | undefined,
      });
    }
  }

  const done = buildDoneItemKeys(
    (completions ?? []) as CompletionRow[],
    (attempts ?? []).map(
      (attempt) =>
        ({
          module_id: attempt.module_id as string,
          score: Number(attempt.score),
          total: Number(attempt.total),
          submitted_at: attempt.submitted_at as string | undefined,
        }) satisfies AttemptRow,
    ),
    [...latestPracticalByModule.values()],
  );

  const required = [
    ...(files ?? []).map((file) => `FILE:${file.id}`),
    ...[...quizModules].map((id) => `QUIZ:${id}`),
    ...practicalModuleIds.map((id) => `PRACTICAL:${id}`),
  ];
  if (required.length === 0) {
    return { complete: false, completedAt: new Date().toISOString() };
  }

  let complete = required.every((key) => done.has(key));
  if (
    complete &&
    courseRequiresHipaaGate(courseRow?.slug as string | undefined)
  ) {
    const hipaa = await fetchHipaaSubmission(admin, studentId, courseId);
    complete = hipaa?.status === "APPROVED";
  }
  const completionTimes = [
    ...(completions ?? []).map((row) => row.completed_at as string),
    ...(attempts ?? [])
      .filter((attempt) => done.has(`QUIZ:${attempt.module_id as string}`))
      .map((attempt) => attempt.submitted_at as string),
    ...(practicalAttempts ?? [])
      .filter((row) => done.has(`PRACTICAL:${row.module_id as string}`))
      .map((row) => row.submitted_at as string),
  ].filter(Boolean);
  const completedAt =
    completionTimes.sort().at(-1) ?? new Date().toISOString();

  return { complete, completedAt };
}
