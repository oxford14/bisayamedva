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
import {
  courseItemsComplete,
  ensureCourseEnrollment,
  maybeCompleteEnrollment,
  recordItemCompletions,
  revalidateCertificatePaths,
} from "@/lib/member/certificates";
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

function afterItemHref(nextHref: string | undefined) {
  return nextHref ?? null;
}

async function finishItemAndMaybeCertify(input: {
  studentId: string;
  courseId: string;
  slug: string;
  role: UserRole;
  staff: boolean;
  current: { kind: "FILE" | "QUIZ"; moduleId: string; itemId: string };
}) {
  const enrollment = await ensureCourseEnrollment(input.studentId, input.courseId);
  await recordItemCompletions(input.studentId, [input.current]);

  const outlineState = await getCoursePlayerState(
    input.studentId,
    input.slug,
    input.staff ? "STUDENT" : input.role,
  );
  const currentIndex = outlineState.flat.findIndex(
    (entry) =>
      entry.moduleId === input.current.moduleId &&
      entry.kind === input.current.kind &&
      entry.itemId === input.current.itemId,
  );
  const isLast = currentIndex >= 0 && currentIndex === outlineState.flat.length - 1;
  if (input.staff && isLast) {
    await recordItemCompletions(input.studentId, outlineState.flat);
  }

  const nextState = await getCoursePlayerState(
    input.studentId,
    input.slug,
    input.staff ? "STUDENT" : input.role,
  );
  if (enrollment && (isLast || courseItemsComplete(nextState))) {
    await maybeCompleteEnrollment(input.studentId, input.courseId, nextState);
  }

  return {
    nextHref: afterItemHref(
      currentIndex >= 0 ? nextState.flat[currentIndex + 1]?.href : undefined,
    ),
  };
}

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
  }

  const finished = await finishItemAndMaybeCertify({
    studentId: profile.id,
    courseId: lesson.course_id as string,
    slug,
    role: profile.role,
    staff,
    current: { kind: "FILE", moduleId, itemId: fileId },
  });

  revalidatePlayer(slug, moduleId);
  revalidateCertificatePaths(slug);
  return {
    ok: true,
    nextHref: finished.nextHref,
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

  const enrollment = await ensureCourseEnrollment(
    profile.id,
    lesson.course_id as string,
  );
  if (!enrollment) {
    return { ok: false, error: "Could not save your quiz result." };
  }

  const writer = staff ? createServiceClient() : await createClient();
  const { error } = await writer.from("course_module_quiz_attempts").insert({
    student_id: profile.id,
    module_id: moduleId,
    enrollment_id: enrollment.id,
    score,
    total: reviewQuestions.length,
    answers: stored,
  });
  if (error) return { ok: false, error: error.message };

  let nextHref: string | null = null;
  if (passed) {
    const finished = await finishItemAndMaybeCertify({
      studentId: profile.id,
      courseId: lesson.course_id as string,
      slug,
      role: profile.role,
      staff,
      current: { kind: "QUIZ", moduleId, itemId: moduleId },
    });
    nextHref = finished.nextHref;
  }

  revalidatePlayer(slug, moduleId);
  revalidateCertificatePaths(slug);
  return {
    ok: true,
    score,
    total: reviewQuestions.length,
    passed,
    nextHref,
    review,
  };
}
