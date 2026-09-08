import { createServiceClient } from "@/lib/supabase/admin";
import { quizPassed } from "@/lib/member/module-player-shared";

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
  const { data: modules } = await admin
    .from("course_modules")
    .select("id")
    .eq("course_id", courseId)
    .eq("status", "PUBLISHED");

  const moduleIds = (modules ?? []).map((row) => row.id as string);
  if (moduleIds.length === 0) {
    return { complete: false, completedAt: new Date().toISOString() };
  }

  const [{ data: files }, { data: questions }, { data: completions }, { data: attempts }] =
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
    ]);

  const quizModules = new Set(
    (questions ?? []).map((row) => row.module_id as string),
  );
  const done = new Set(
    (completions ?? []).map((row) => `${row.item_kind}:${row.item_id}`),
  );
  for (const attempt of attempts ?? []) {
    if (quizPassed(Number(attempt.score), Number(attempt.total))) {
      done.add(`QUIZ:${attempt.module_id as string}`);
    }
  }

  const required = [
    ...(files ?? []).map((file) => `FILE:${file.id}`),
    ...[...quizModules].map((id) => `QUIZ:${id}`),
  ];
  if (required.length === 0) {
    return { complete: false, completedAt: new Date().toISOString() };
  }

  const complete = required.every((key) => done.has(key));
  const completionTimes = [
    ...(completions ?? []).map((row) => row.completed_at as string),
    ...(attempts ?? [])
      .filter((attempt) =>
        quizPassed(Number(attempt.score), Number(attempt.total)),
      )
      .map((attempt) => attempt.submitted_at as string),
  ].filter(Boolean);
  const completedAt =
    completionTimes.sort().at(-1) ?? new Date().toISOString();

  return { complete, completedAt };
}
