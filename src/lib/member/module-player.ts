import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole, type UserRole } from "@/lib/supabase/auth";
import { modulesCopy } from "@/content/site";
import { isVideoMime } from "@/lib/modules/storage";
import {
  canOpenCourseModules,
  getStudentCourseModules,
  type CourseModuleAccess,
  type StudentModuleFile,
  type StudentQuizAttempt,
  type StudentQuizQuestion,
} from "@/lib/member/modules";
import {
  mapQuizReviewQuestions,
  toStudentQuizAttempt,
} from "@/lib/member/quiz-review";
import {
  fileItemKey,
  fileTitle,
  itemHref,
  moduleFileHref,
  parseItemKey,
  quizItemKey,
  quizPassed,
  type PlayerItemKind,
  type PlayerItemLabel,
} from "@/lib/member/module-player-shared";

export {
  QUIZ_PASS_RATIO,
  displayFileName,
  fileItemKey,
  fileTitle,
  itemHref,
  moduleFileHref,
  parseItemKey,
  quizItemKey,
  quizPassed,
} from "@/lib/member/module-player-shared";
export type { PlayerItemKind, PlayerItemLabel } from "@/lib/member/module-player-shared";

export type PlayerOutlineItem = {
  key: string;
  kind: PlayerItemKind;
  moduleId: string;
  itemId: string;
  title: string;
  label: PlayerItemLabel;
  complete: boolean;
  locked: boolean;
  href: string;
};

export type PlayerOutlineModule = {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  locked: boolean;
  items: PlayerOutlineItem[];
};

export type CoursePlayerState = {
  course: {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
  } | null;
  access: CourseModuleAccess;
  outline: PlayerOutlineModule[];
  flat: PlayerOutlineItem[];
  todayDone: number;
  todayGoal: number;
};

export type PlayerItemView = CoursePlayerState & {
  active: PlayerOutlineItem | null;
  next: PlayerOutlineItem | null;
  file: StudentModuleFile | null;
  quiz: StudentQuizQuestion[];
  latestAttempt: StudentQuizAttempt | null;
};

function startOfPhtDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${parts}T00:00:00+08:00`);
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getCoursePlayerState(
  studentId: string,
  slug: string,
  role?: UserRole | null,
): Promise<CoursePlayerState> {
  const { course, access, modules } = await getStudentCourseModules(
    studentId,
    slug,
    role,
  );
  const todayGoal = modulesCopy.todayGoal;
  if (!course) {
    return {
      course: null,
      access,
      outline: [],
      flat: [],
      todayDone: 0,
      todayGoal,
    };
  }

  const admin = createServiceClient();
  const moduleIds = modules.map((item) => item.id);
  const staff = isAdminRole(role);
  const courseOpen = canOpenCourseModules(access);

  const [{ data: fileRows }, { data: questionRows }, { data: completions }, { data: attempts }] =
    await Promise.all([
      moduleIds.length
        ? admin
            .from("course_module_files")
            .select("id, module_id, file_name, mime_type, sort_order")
            .in("module_id", moduleIds)
            .order("sort_order", { ascending: true })
        : Promise.resolve({ data: [] as never[] }),
      moduleIds.length
        ? admin
            .from("course_module_quiz_questions")
            .select("id, module_id")
            .in("module_id", moduleIds)
        : Promise.resolve({ data: [] as never[] }),
      staff || !moduleIds.length
        ? Promise.resolve({ data: [] as never[] })
        : (await createClient())
            .from("course_module_item_completions")
            .select("item_kind, item_id, completed_at")
            .eq("student_id", studentId)
            .in("module_id", moduleIds),
      staff || !moduleIds.length
        ? Promise.resolve({ data: [] as never[] })
        : (await createClient())
            .from("course_module_quiz_attempts")
            .select("module_id, score, total")
            .eq("student_id", studentId)
            .in("module_id", moduleIds),
    ]);

  type OutlineFileRow = {
    id: string;
    module_id: string;
    file_name: string;
    mime_type: string;
    sort_order: number;
  };
  const filesByModule = new Map<string, OutlineFileRow[]>();
  for (const row of (fileRows ?? []) as OutlineFileRow[]) {
    const list = filesByModule.get(row.module_id) ?? [];
    list.push(row);
    filesByModule.set(row.module_id, list);
  }
  const quizModules = new Set(
    (questionRows ?? []).map((row) => row.module_id as string),
  );
  const done = new Set(
    (completions ?? []).map(
      (row) => `${row.item_kind}:${row.item_id}`,
    ),
  );
  for (const attempt of attempts ?? []) {
    if (quizPassed(Number(attempt.score), Number(attempt.total))) {
      done.add(`QUIZ:${attempt.module_id}`);
    }
  }

  const phtStart = startOfPhtDay();
  const todayDone = (completions ?? []).filter((row) => {
    const at = new Date(row.completed_at as string);
    return !Number.isNaN(at.getTime()) && at.getTime() >= phtStart.getTime();
  }).length;

  const outline: PlayerOutlineModule[] = [];
  const flat: PlayerOutlineItem[] = [];

  for (const lesson of modules) {
    const items: PlayerOutlineItem[] = [];
    const files = (filesByModule.get(lesson.id) ?? []).slice().sort(
      (a, b) => Number(a.sort_order) - Number(b.sort_order),
    );
    for (const file of files) {
      const key = fileItemKey(file.id as string);
      items.push({
        key,
        kind: "FILE",
        moduleId: lesson.id,
        itemId: file.id as string,
        title: fileTitle(file.file_name as string),
        label: isVideoMime(file.mime_type as string) ? "Video" : "Reading",
        complete: staff ? false : done.has(`FILE:${file.id}`),
        locked: false,
        href: itemHref(course.slug, lesson.id, key),
      });
    }
    if (quizModules.has(lesson.id)) {
      items.push({
        key: quizItemKey(),
        kind: "QUIZ",
        moduleId: lesson.id,
        itemId: lesson.id,
        title: modulesCopy.quizTitle,
        label: "Quiz",
        complete: staff ? false : done.has(`QUIZ:${lesson.id}`),
        locked: false,
        href: itemHref(course.slug, lesson.id, quizItemKey()),
      });
    }
    outline.push({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      status:
        lesson.status === "DRAFT" || lesson.status === "ARCHIVED"
          ? lesson.status
          : "PUBLISHED",
      locked: false,
      items,
    });
    flat.push(...items);
  }

  if (!staff && courseOpen) {
    let previousComplete = true;
    for (const item of flat) {
      item.locked = !previousComplete;
      if (!item.complete) previousComplete = false;
    }
  } else if (!courseOpen) {
    for (const item of flat) item.locked = true;
  }

  for (const lesson of outline) {
    lesson.locked = lesson.items[0]?.locked === true;
  }

  return { course, access, outline, flat, todayDone, todayGoal };
}

export function isModuleLocked(state: CoursePlayerState, moduleId: string) {
  return state.outline.find((lesson) => lesson.id === moduleId)?.locked ?? true;
}

export function firstUnlockedItem(state: CoursePlayerState, moduleId?: string) {
  const scoped = moduleId
    ? state.flat.filter((item) => item.moduleId === moduleId)
    : state.flat;
  return scoped.find((item) => !item.locked) ?? null;
}

export async function getPlayerItemView(
  studentId: string,
  slug: string,
  moduleId: string,
  itemKey: string,
  role?: UserRole | null,
): Promise<PlayerItemView> {
  const state = await getCoursePlayerState(studentId, slug, role);
  const parsed = parseItemKey(itemKey);
  const active =
    parsed &&
    state.flat.find(
      (item) =>
        item.moduleId === moduleId &&
        item.key === itemKey &&
        (parsed.kind === "QUIZ" || item.itemId === parsed.id),
    );

  const activeIndex = active
    ? state.flat.findIndex(
        (item) => item.moduleId === active.moduleId && item.key === active.key,
      )
    : -1;
  const next = activeIndex >= 0 ? (state.flat[activeIndex + 1] ?? null) : null;

  const empty: PlayerItemView = {
    ...state,
    active: active ?? null,
    next,
    file: null,
    quiz: [],
    latestAttempt: null,
  };

  if (!state.course || !active || active.locked) {
    return empty;
  }

  const admin = createServiceClient();
  if (active.kind === "FILE") {
    const { data: fileRow } = await admin
      .from("course_module_files")
      .select("id, file_name, mime_type, byte_size, storage_path")
      .eq("id", active.itemId)
      .eq("module_id", moduleId)
      .maybeSingle();
    if (!fileRow) return empty;
    return {
      ...empty,
      file: {
        id: fileRow.id as string,
        fileName: fileRow.file_name as string,
        mimeType: fileRow.mime_type as string,
        byteSize: Number(fileRow.byte_size),
        url: moduleFileHref(fileRow.id as string),
      },
    };
  }

  const [{ data: questionRows }, { data: attemptRows }] = await Promise.all([
    admin
      .from("course_module_quiz_questions")
      .select("id, prompt, explanation, sort_order, course_module_quiz_options(id, label, is_correct, sort_order)")
      .eq("module_id", moduleId)
      .order("sort_order", { ascending: true }),
    (await createClient())
      .from("course_module_quiz_attempts")
      .select("score, total, submitted_at, answers")
      .eq("student_id", studentId)
      .eq("module_id", moduleId)
      .order("submitted_at", { ascending: false })
      .limit(1),
  ]);

  const quiz: StudentQuizQuestion[] = (questionRows ?? []).map((row) => {
    const options = (
      (row.course_module_quiz_options as
        | { id: string; label: string; sort_order: number }[]
        | null) ?? []
    )
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((option) => ({ id: option.id, label: option.label }));
    return {
      id: row.id as string,
      prompt: row.prompt as string,
      options,
    };
  });
  const latest = one(
    attemptRows as
      | { score: number; total: number; submitted_at: string; answers: unknown }
      | { score: number; total: number; submitted_at: string; answers: unknown }[]
      | null,
  );

  return {
    ...empty,
    quiz,
    latestAttempt: latest
      ? toStudentQuizAttempt(latest, mapQuizReviewQuestions(questionRows))
      : null,
  };
}

export type AuthorizedModuleFile = {
  fileName: string;
  mimeType: string;
  storagePath: string;
  staff: boolean;
};

export async function authorizePlayerFile(
  studentId: string,
  fileId: string,
  role?: UserRole | null,
): Promise<AuthorizedModuleFile | null> {
  const admin = createServiceClient();
  const { data: fileRow } = await admin
    .from("course_module_files")
    .select("id, file_name, mime_type, storage_path, module_id")
    .eq("id", fileId)
    .maybeSingle();
  if (!fileRow) return null;

  const { data: lesson } = await admin
    .from("course_modules")
    .select("id, course_id")
    .eq("id", fileRow.module_id as string)
    .maybeSingle();
  if (!lesson) return null;

  const { data: course } = await admin
    .from("courses")
    .select("slug")
    .eq("id", lesson.course_id as string)
    .maybeSingle();
  if (!course?.slug) return null;

  const state = await getCoursePlayerState(studentId, course.slug as string, role);
  const item = state.flat.find(
    (entry) => entry.kind === "FILE" && entry.itemId === fileId,
  );
  if (!item || item.locked) return null;

  return {
    fileName: fileRow.file_name as string,
    mimeType: fileRow.mime_type as string,
    storagePath: fileRow.storage_path as string,
    staff: isAdminRole(role),
  };
}
