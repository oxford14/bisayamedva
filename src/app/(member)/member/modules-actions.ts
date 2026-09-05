"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStudent } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  canOpenCourseModules,
  courseModuleAccess,
} from "@/lib/member/modules";
import { getMemberEnrollments } from "@/lib/member/data";

const uuid = z.guid();

export type QuizSubmitResult =
  | { ok: true; score: number; total: number }
  | { ok: false; error: string };

export async function submitModuleQuiz(
  moduleId: string,
  answers: Record<string, string>,
): Promise<QuizSubmitResult> {
  const profile = await requireStudent();
  if (!uuid.safeParse(moduleId).success) {
    return { ok: false, error: "Invalid module." };
  }

  const admin = createServiceClient();
  const { data: module } = await admin
    .from("course_modules")
    .select("id, course_id, status")
    .eq("id", moduleId)
    .maybeSingle();

  if (!module || module.status !== "PUBLISHED") {
    return { ok: false, error: "Module not found." };
  }

  const enrollments = await getMemberEnrollments(profile.id);
  const access = courseModuleAccess(enrollments, module.course_id as string);
  if (!canOpenCourseModules(access) || !access.enrollmentId) {
    return {
      ok: false,
      error: "Locked pa ni. Open ni during your scheduled Zoom and after.",
    };
  }

  const { data: questions } = await admin
    .from("course_module_quiz_questions")
    .select("id, course_module_quiz_options(id, is_correct)")
    .eq("module_id", moduleId);

  const list = questions ?? [];
  if (list.length === 0) {
    return { ok: false, error: "Wala pa quiz for this module." };
  }

  let score = 0;
  const stored: Record<string, string> = {};
  for (const question of list) {
    const selected = answers[question.id as string];
    if (selected && uuid.safeParse(selected).success) {
      stored[question.id as string] = selected;
    }
    const options =
      (question.course_module_quiz_options as
        | { id: string; is_correct: boolean }[]
        | null) ?? [];
    const correct = options.find((option) => option.is_correct);
    if (correct && selected === correct.id) score += 1;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("course_module_quiz_attempts").insert({
    student_id: profile.id,
    module_id: moduleId,
    enrollment_id: access.enrollmentId,
    score,
    total: list.length,
    answers: stored,
  });
  if (error) return { ok: false, error: error.message };

  const { data: course } = await admin
    .from("courses")
    .select("slug")
    .eq("id", module.course_id)
    .maybeSingle();
  if (course?.slug) {
    revalidatePath(`/member/modules/${course.slug}/${moduleId}`);
  }
  revalidatePath("/member/modules");
  return { ok: true, score, total: list.length };
}
