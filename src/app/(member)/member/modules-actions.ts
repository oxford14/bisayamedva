"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminRole, requireStudent, type UserRole } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  canOpenCourseModules,
  courseModuleAccess,
} from "@/lib/member/modules";
import {
  fileItemKey,
  getCoursePlayerState,
  quizItemKey,
  quizPassed,
} from "@/lib/member/module-player";
import { getMemberEnrollments } from "@/lib/member/data";
import {
  buildQuizReview,
  mapQuizReviewQuestions,
  type StudentQuizReviewItem,
} from "@/lib/member/quiz-review";

const uuid = z.guid();

export type QuizSubmitResult =
  | {
      ok: true;
      score: number;
      total: number;
      passed: boolean;
      nextHref: string | null;
      review: StudentQuizReviewItem[];
    }
  | { ok: false; error: string };

export type CompleteItemResult =
  | { ok: true; nextHref: string | null }
  | { ok: false; error: string };

function revalidatePlayer(slug: string | null | undefined, moduleId: string) {
  revalidatePath("/member/modules");
  if (slug) {
    revalidatePath(`/member/modules/${slug}`);
    revalidatePath(`/member/modules/${slug}/${moduleId}`);
    revalidatePath(`/member/modules/${slug}/${moduleId}/${quizItemKey()}`);
  }
}

async function loadCourseSlug(courseId: string) {
  const admin = createServiceClient();
  const { data } = await admin.from("courses").select("slug").eq("id", courseId).maybeSingle();
  return (data?.slug as string | undefined) ?? null;
}

async function requireOpenItem(
  studentId: string,
  role: UserRole,
  slug: string,
  moduleId: string,
  itemKey: string,
) {
  const state = await getCoursePlayerState(studentId, slug, role);
  const item = state.flat.find(
    (entry) => entry.moduleId === moduleId && entry.key === itemKey,
  );
  if (!item) return { ok: false as const, error: "Item not found." };
  if (item.locked) {
    return {
      ok: false as const,
      error: "Locked pa ni. Finish the previous item una.",
    };
  }
  return { ok: true as const, item, state };
}

export async function completeModuleFile(
  moduleId: string,
  fileId: string,
): Promise<CompleteItemResult> {
  const profile = await requireStudent();
  if (!uuid.safeParse(moduleId).success || !uuid.safeParse(fileId).success) {
    return { ok: false, error: "Invalid item." };
  }

  const admin = createServiceClient();
  const { data: lesson } = await admin
    .from("course_modules")
    .select("id, course_id, status")
    .eq("id", moduleId)
    .maybeSingle();
  if (!lesson) return { ok: false, error: "Module not found." };

  const slug = await loadCourseSlug(lesson.course_id as string);
  if (!slug) return { ok: false, error: "Course not found." };

  const staff = isAdminRole(profile.role);
  if (!staff) {
    const opened = await requireOpenItem(
      profile.id,
      profile.role,
      slug,
      moduleId,
      fileItemKey(fileId),
    );
    if (!opened.ok) return opened;

    const supabase = await createClient();
    const { error } = await supabase.from("course_module_item_completions").upsert(
      {
        student_id: profile.id,
        module_id: moduleId,
        item_kind: "FILE",
        item_id: fileId,
      },
      { onConflict: "student_id,item_kind,item_id", ignoreDuplicates: true },
    );
    if (error) return { ok: false, error: error.message };
  }

  revalidatePlayer(slug, moduleId);
  const nextState = await getCoursePlayerState(profile.id, slug, profile.role);
  const currentIndex = nextState.flat.findIndex(
    (entry) => entry.moduleId === moduleId && entry.key === fileItemKey(fileId),
  );
  return {
    ok: true,
    nextHref: currentIndex >= 0 ? (nextState.flat[currentIndex + 1]?.href ?? `/member/modules/${slug}`) : `/member/modules/${slug}`,
  };
}

export async function submitModuleQuiz(
  moduleId: string,
  answers: Record<string, string>,
): Promise<QuizSubmitResult> {
  const profile = await requireStudent();
  if (!uuid.safeParse(moduleId).success) {
    return { ok: false, error: "Invalid module." };
  }

  const admin = createServiceClient();
  const { data: lesson } = await admin
    .from("course_modules")
    .select("id, course_id, status")
    .eq("id", moduleId)
    .maybeSingle();

  const staff = isAdminRole(profile.role);
  if (
    !lesson ||
    (lesson.status !== "PUBLISHED" && !(staff && lesson.status === "DRAFT"))
  ) {
    return { ok: false, error: "Module not found." };
  }

  const slug = await loadCourseSlug(lesson.course_id as string);
  if (!slug) return { ok: false, error: "Course not found." };

  if (!staff) {
    const enrollments = await getMemberEnrollments(profile.id);
    const access = courseModuleAccess(enrollments, lesson.course_id as string);
    if (!canOpenCourseModules(access) || !access.enrollmentId) {
      return {
        ok: false,
        error: "Locked pa ni. Open ni during your scheduled Zoom and after.",
      };
    }
    const opened = await requireOpenItem(
      profile.id,
      profile.role,
      slug,
      moduleId,
      quizItemKey(),
    );
    if (!opened.ok) return opened;
  }

  const { data: questions } = await admin
    .from("course_module_quiz_questions")
    .select(
      "id, prompt, explanation, sort_order, course_module_quiz_options(id, label, is_correct, sort_order)",
    )
    .eq("module_id", moduleId)
    .order("sort_order", { ascending: true });

  const reviewQuestions = mapQuizReviewQuestions(questions);
  if (reviewQuestions.length === 0) {
    return { ok: false, error: "Wala pa quiz for this module." };
  }

  const stored: Record<string, string> = {};
  for (const question of reviewQuestions) {
    const selected = answers[question.id];
    if (selected && uuid.safeParse(selected).success) {
      stored[question.id] = selected;
    }
  }

  const review = buildQuizReview(reviewQuestions, stored);
  const score = review.filter((item) => item.correct).length;
  const passed = quizPassed(score, reviewQuestions.length);

  if (staff) {
    const nextState = await getCoursePlayerState(profile.id, slug, profile.role);
    const currentIndex = nextState.flat.findIndex(
      (entry) => entry.moduleId === moduleId && entry.key === quizItemKey(),
    );
    return {
      ok: true,
      score,
      total: reviewQuestions.length,
      passed,
      nextHref:
        currentIndex >= 0
          ? (nextState.flat[currentIndex + 1]?.href ?? `/member/modules/${slug}`)
          : `/member/modules/${slug}`,
      review,
    };
  }

  const enrollments = await getMemberEnrollments(profile.id);
  const access = courseModuleAccess(enrollments, lesson.course_id as string);

  const supabase = await createClient();
  const { error } = await supabase.from("course_module_quiz_attempts").insert({
    student_id: profile.id,
    module_id: moduleId,
    enrollment_id: access.enrollmentId,
    score,
    total: reviewQuestions.length,
    answers: stored,
  });
  if (error) return { ok: false, error: error.message };

  if (passed) {
    await supabase.from("course_module_item_completions").upsert(
      {
        student_id: profile.id,
        module_id: moduleId,
        item_kind: "QUIZ",
        item_id: moduleId,
      },
      { onConflict: "student_id,item_kind,item_id", ignoreDuplicates: true },
    );
  }

  revalidatePlayer(slug, moduleId);
  const nextState = await getCoursePlayerState(profile.id, slug, profile.role);
  const currentIndex = nextState.flat.findIndex(
    (entry) => entry.moduleId === moduleId && entry.key === quizItemKey(),
  );
  return {
    ok: true,
    score,
    total: reviewQuestions.length,
    passed,
    nextHref:
      passed && currentIndex >= 0
        ? (nextState.flat[currentIndex + 1]?.href ?? `/member/modules/${slug}`)
        : null,
    review,
  };
}
