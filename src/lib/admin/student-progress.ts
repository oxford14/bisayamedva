import { formatModuleUnlockWhen } from "@/lib/member/modules";
import { modulesUnlockedForEnrollment } from "@/lib/member/module-access-shared";
import {
  buildDoneItemKeys,
  moduleStatusForKeys,
  type AttemptRow,
  type CompletionRow,
} from "@/lib/member/module-item-progress";
import { createServiceClient } from "@/lib/supabase/admin";

const QUALIFYING_ENROLLMENT = new Set(["ACTIVE", "COMPLETED"]);

export type ModuleProgressStatus =
  | "locked"
  | "not_started"
  | "in_progress"
  | "complete";

export type CourseModuleProgress = {
  id: string;
  title: string;
  sortOrder: number;
  status: ModuleProgressStatus;
};

export type StudentCourseProgressSummary = {
  courseId: string;
  courseTitle: string;
  courseSlug: string | null;
  enrollmentId: string;
  enrollmentStatus: string;
  modulesUnlocked: boolean;
  unlockLabel: string | null;
  completedModuleCount: number;
  totalModuleCount: number;
  currentModuleTitle: string | null;
  courseComplete: boolean;
  modules: CourseModuleProgress[];
};

export type StudentProgressListRow = StudentCourseProgressSummary & {
  studentId: string;
  studentName: string;
  studentEmail: string;
};

export type CourseCurriculum = {
  courseId: string;
  modules: {
    id: string;
    title: string;
    sortOrder: number;
    requiredKeys: string[];
  }[];
  allModuleIds: string[];
  allRequiredKeys: string[];
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeEnrollmentRow(raw: EnrollmentRow): EnrollmentRow {
  type Profile = NonNullable<EnrollmentRow["profiles"]>;
  type Course = NonNullable<EnrollmentRow["courses"]>;
  type Session = NonNullable<EnrollmentRow["sessions"]>;
  return {
    ...raw,
    profiles: one<Profile>(raw.profiles as Profile | Profile[] | null),
    courses: one<Course>(raw.courses as Course | Course[] | null),
    sessions: one<Session>(raw.sessions as Session | Session[] | null),
  };
}

export function enrollmentModulesUnlocked(
  enrollmentStatus: string,
  sessionStartsAt: string | null,
  sessionTimezone: string | null | undefined,
): { unlocked: boolean; unlockLabel: string | null } {
  const unlocked = modulesUnlockedForEnrollment(enrollmentStatus);
  const unlockLabel = sessionStartsAt
    ? formatModuleUnlockWhen(sessionStartsAt, sessionTimezone)
    : null;
  return { unlocked, unlockLabel };
}

export function summarizeStudentCourseProgress(
  curriculum: CourseCurriculum,
  done: Set<string>,
  access: { unlocked: boolean },
): Omit<
  StudentCourseProgressSummary,
  | "courseId"
  | "courseTitle"
  | "courseSlug"
  | "enrollmentId"
  | "enrollmentStatus"
  | "modulesUnlocked"
  | "unlockLabel"
> & {
  modulesUnlocked: boolean;
} {
  const modules: CourseModuleProgress[] = curriculum.modules.map((mod) => {
    let status: ModuleProgressStatus;
    if (!access.unlocked) {
      status = "locked";
    } else {
      const itemStatus = moduleStatusForKeys(mod.requiredKeys, done);
      status =
        itemStatus === "complete"
          ? "complete"
          : itemStatus === "in_progress"
            ? "in_progress"
            : "not_started";
    }
    return {
      id: mod.id,
      title: mod.title,
      sortOrder: mod.sortOrder,
      status,
    };
  });

  const totalModuleCount = modules.length;
  const completedModuleCount = modules.filter((m) => m.status === "complete")
    .length;
  const courseComplete =
    access.unlocked &&
    curriculum.allRequiredKeys.length > 0 &&
    curriculum.allRequiredKeys.every((key) => done.has(key));

  let currentModuleTitle: string | null = null;
  if (access.unlocked && !courseComplete) {
    const current = modules.find(
      (m) => m.status === "not_started" || m.status === "in_progress",
    );
    currentModuleTitle = current?.title ?? null;
  }

  return {
    modulesUnlocked: access.unlocked,
    completedModuleCount,
    totalModuleCount,
    currentModuleTitle,
    courseComplete,
    modules,
  };
}

export async function loadCourseCurricula(
  courseIds: string[],
): Promise<Map<string, CourseCurriculum>> {
  const map = new Map<string, CourseCurriculum>();
  const unique = [...new Set(courseIds.filter(Boolean))];
  if (unique.length === 0) return map;

  const admin = createServiceClient();
  const { data: moduleRows } = await admin
    .from("course_modules")
    .select("id, course_id, title, sort_order")
    .in("course_id", unique)
    .eq("status", "PUBLISHED")
    .order("sort_order", { ascending: true });

  const modules = moduleRows ?? [];
  const moduleIds = modules.map((row) => row.id as string);

  const [{ data: fileRows }, { data: questionRows }] = await Promise.all([
    moduleIds.length
      ? admin
          .from("course_module_files")
          .select("id, module_id")
          .in("module_id", moduleIds)
      : Promise.resolve({ data: [] as { id: string; module_id: string }[] }),
    moduleIds.length
      ? admin
          .from("course_module_quiz_questions")
          .select("module_id")
          .in("module_id", moduleIds)
      : Promise.resolve({ data: [] as { module_id: string }[] }),
  ]);

  const filesByModule = new Map<string, string[]>();
  for (const file of fileRows ?? []) {
    const list = filesByModule.get(file.module_id as string) ?? [];
    list.push(file.id as string);
    filesByModule.set(file.module_id as string, list);
  }
  const quizModules = new Set(
    (questionRows ?? []).map((row) => row.module_id as string),
  );

  for (const courseId of unique) {
    const courseModules = modules.filter((row) => row.course_id === courseId);
    const curriculumModules = courseModules.map((row) => {
      const id = row.id as string;
      const fileIds = filesByModule.get(id) ?? [];
      const requiredKeys = [
        ...fileIds.map((fileId) => `FILE:${fileId}`),
        ...(quizModules.has(id) ? [`QUIZ:${id}`] : []),
      ];
      return {
        id,
        title: row.title as string,
        sortOrder: Number(row.sort_order ?? 0),
        requiredKeys,
      };
    });
    const allRequiredKeys = curriculumModules.flatMap((m) => m.requiredKeys);
    map.set(courseId, {
      courseId,
      modules: curriculumModules,
      allModuleIds: curriculumModules.map((m) => m.id),
      allRequiredKeys,
    });
  }

  return map;
}

async function loadProgressDataForStudents(
  studentIds: string[],
  moduleIds: string[],
): Promise<{
  completionsByStudent: Map<string, StoredCompletion[]>;
  attemptsByStudent: Map<string, AttemptRow[]>;
}> {
  const completionsByStudent = new Map<string, StoredCompletion[]>();
  const attemptsByStudent = new Map<string, AttemptRow[]>();
  const uniqueStudents = [...new Set(studentIds.filter(Boolean))];
  if (uniqueStudents.length === 0 || moduleIds.length === 0) {
    return { completionsByStudent, attemptsByStudent };
  }

  const admin = createServiceClient();
  const [{ data: completions }, { data: attempts }] = await Promise.all([
    admin
      .from("course_module_item_completions")
      .select("student_id, item_kind, item_id, completed_at, module_id")
      .in("student_id", uniqueStudents)
      .in("module_id", moduleIds),
    admin
      .from("course_module_quiz_attempts")
      .select("student_id, module_id, score, total, submitted_at")
      .in("student_id", uniqueStudents)
      .in("module_id", moduleIds),
  ]);

  for (const row of completions ?? []) {
    const sid = row.student_id as string;
    const list = completionsByStudent.get(sid) ?? [];
    list.push({
      item_kind: row.item_kind as string,
      item_id: row.item_id as string,
      completed_at: row.completed_at as string,
      module_id: row.module_id as string,
    });
    completionsByStudent.set(sid, list);
  }
  for (const row of attempts ?? []) {
    const sid = row.student_id as string;
    const list = attemptsByStudent.get(sid) ?? [];
    list.push({
      module_id: row.module_id as string,
      score: Number(row.score),
      total: Number(row.total),
      submitted_at: row.submitted_at as string | undefined,
    });
    attemptsByStudent.set(sid, list);
  }

  return { completionsByStudent, attemptsByStudent };
}

type EnrollmentRow = {
  id: string;
  status: string;
  student_id: string;
  course_id: string;
  profiles: { full_name: string; email: string; role: string } | null;
  courses: { id: string; title: string; slug: string | null } | null;
  sessions: { starts_at: string | null; timezone: string | null } | null;
};

type StoredCompletion = CompletionRow & { module_id: string };

function buildSummaryForEnrollment(
  row: EnrollmentRow,
  curriculum: CourseCurriculum | undefined,
  completions: StoredCompletion[],
  attempts: AttemptRow[],
): StudentCourseProgressSummary | null {
  const profile = row.profiles;
  const course = row.courses;
  if (!profile || profile.role !== "STUDENT" || !course) return null;
  if (!QUALIFYING_ENROLLMENT.has(row.status)) return null;

  const session = row.sessions;
  const access = enrollmentModulesUnlocked(
    row.status,
    session?.starts_at ?? null,
    session?.timezone,
  );

  const emptyCurriculum: CourseCurriculum = {
    courseId: row.course_id,
    modules: [],
    allModuleIds: [],
    allRequiredKeys: [],
  };
  const cur = curriculum ?? emptyCurriculum;
  const moduleIdSet = new Set(cur.allModuleIds);
  const filteredCompletions = completions.filter((c) =>
    moduleIdSet.has(c.module_id),
  );
  const filteredAttempts = attempts.filter((a) =>
    moduleIdSet.has(a.module_id),
  );
  const done = buildDoneItemKeys(filteredCompletions, filteredAttempts);
  const summary = summarizeStudentCourseProgress(cur, done, access);

  return {
    courseId: course.id,
    courseTitle: course.title,
    courseSlug: course.slug,
    enrollmentId: row.id,
    enrollmentStatus: row.status,
    unlockLabel: access.unlockLabel,
    ...summary,
  };
}

export async function listStudentProgressRows(options: {
  courseId?: string;
  q?: string;
  enrollmentStatus?: string;
}): Promise<StudentProgressListRow[]> {
  const admin = createServiceClient();
  let query = admin
    .from("enrollments")
    .select(
      "id, status, student_id, course_id, profiles(full_name, email, role), courses(id, title, slug), sessions(starts_at, timezone)",
    )
    .in("status", ["ACTIVE", "COMPLETED"])
    .order("created_at", { ascending: false });

  if (options.courseId) {
    query = query.eq("course_id", options.courseId);
  }
  if (options.enrollmentStatus && options.enrollmentStatus !== "ALL") {
    query = query.eq("status", options.enrollmentStatus);
  }

  const { data: enrollmentRows } = await query;
  let rows = ((enrollmentRows ?? []) as unknown as EnrollmentRow[]).map(
    normalizeEnrollmentRow,
  );

  if (options.q?.trim()) {
    const needle = options.q.trim().toLowerCase();
    rows = rows.filter((row) => {
      const p = row.profiles;
      if (!p) return false;
      return (
        p.full_name.toLowerCase().includes(needle) ||
        p.email.toLowerCase().includes(needle)
      );
    });
  }

  rows = rows.filter(
    (row) => row.profiles?.role === "STUDENT" && row.courses,
  );

  const courseIds = [...new Set(rows.map((r) => r.course_id))];
  const studentIds = [...new Set(rows.map((r) => r.student_id))];
  const curricula = await loadCourseCurricula(courseIds);
  const allModuleIds = [
    ...new Set(
      [...curricula.values()].flatMap((c) => c.allModuleIds),
    ),
  ];
  const { completionsByStudent, attemptsByStudent } =
    await loadProgressDataForStudents(studentIds, allModuleIds);

  const result: StudentProgressListRow[] = [];
  for (const row of rows) {
    const curriculum = curricula.get(row.course_id);
    const completions = completionsByStudent.get(row.student_id) ?? [];
    const attempts = attemptsByStudent.get(row.student_id) ?? [];
    const summary = buildSummaryForEnrollment(
      row,
      curriculum,
      completions,
      attempts,
    );
    if (!summary) continue;
    const profile = row.profiles!;
    result.push({
      ...summary,
      studentId: row.student_id,
      studentName: profile.full_name,
      studentEmail: profile.email,
    });
  }

  result.sort((a, b) =>
    a.studentName.localeCompare(b.studentName, undefined, {
      sensitivity: "base",
    }),
  );

  return result;
}

export async function getStudentProgressByCourse(
  studentId: string,
): Promise<StudentCourseProgressSummary[]> {
  const admin = createServiceClient();
  const { data: enrollmentRows } = await admin
    .from("enrollments")
    .select(
      "id, status, student_id, course_id, profiles(full_name, email, role), courses(id, title, slug), sessions(starts_at, timezone)",
    )
    .eq("student_id", studentId)
    .in("status", ["ACTIVE", "COMPLETED"])
    .order("created_at", { ascending: false });

  const rows = ((enrollmentRows ?? []) as unknown as EnrollmentRow[]).map(
    normalizeEnrollmentRow,
  );
  const filtered = rows.filter(
    (row) => row.profiles?.role === "STUDENT" && row.courses,
  );
  if (filtered.length === 0) return [];

  const courseIds = [...new Set(filtered.map((r) => r.course_id))];
  const curricula = await loadCourseCurricula(courseIds);
  const allModuleIds = [
    ...new Set(
      [...curricula.values()].flatMap((c) => c.allModuleIds),
    ),
  ];
  const { completionsByStudent, attemptsByStudent } =
    await loadProgressDataForStudents([studentId], allModuleIds);
  const completions = completionsByStudent.get(studentId) ?? [];
  const attempts = attemptsByStudent.get(studentId) ?? [];

  return filtered
    .map((row) =>
      buildSummaryForEnrollment(row, curricula.get(row.course_id), completions, attempts),
    )
    .filter((row): row is StudentCourseProgressSummary => row !== null);
}
