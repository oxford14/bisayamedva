import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getMemberEnrollments,
  type MemberEnrollment,
  type MemberSession,
} from "@/lib/member/data";
import {
  MODULE_FILES_BUCKET,
  MODULE_FILE_SIGNED_TTL_SECONDS,
} from "@/lib/modules/storage";

const QUALIFYING = new Set(["ACTIVE", "COMPLETED"]);

export type CourseModuleAccess = {
  enrolled: boolean;
  unlocked: boolean;
  unlocksAt: string | null;
  unlockLabel: string | null;
  enrollmentId: string | null;
  session: MemberSession | null;
};

export type ModuleCourseCard = {
  courseId: string;
  slug: string;
  title: string;
  subtitle: string | null;
  unlocked: boolean;
  unlocksAt: string | null;
  unlockLabel: string | null;
  enrollmentId: string;
};

export type StudentModuleListItem = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
};

export type StudentModuleFile = {
  id: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  url: string | null;
};

export type StudentQuizQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
};

export type StudentQuizAttempt = {
  score: number;
  total: number;
  submittedAt: string;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function formatModuleUnlockWhen(
  startsAt: string | null,
  timezone?: string | null,
) {
  if (!startsAt) return null;
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return null;
  const tz = timezone || "Asia/Manila";
  const date = new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: tz,
  }).format(start);
  const time = new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).format(start);
  return `${date} · ${time} ${tz === "Asia/Manila" ? "PHT" : tz}`;
}

export function courseModuleAccess(
  enrollments: MemberEnrollment[],
  courseId: string,
  now = new Date(),
): CourseModuleAccess {
  const relevant = enrollments.filter(
    (enrollment) =>
      enrollment.course?.id === courseId && QUALIFYING.has(enrollment.status),
  );

  if (relevant.length === 0) {
    return {
      enrolled: false,
      unlocked: false,
      unlocksAt: null,
      unlockLabel: null,
      enrollmentId: null,
      session: null,
    };
  }

  const dated = relevant
    .map((enrollment) => ({
      enrollment,
      start: enrollment.session?.starts_at
        ? new Date(enrollment.session.starts_at)
        : null,
    }))
    .filter((row) => row.start && !Number.isNaN(row.start.getTime())) as {
    enrollment: MemberEnrollment;
    start: Date;
  }[];

  const started = dated
    .filter((row) => row.start.getTime() <= now.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  if (started[0]) {
    const pick = started[0];
    return {
      enrolled: true,
      unlocked: true,
      unlocksAt: pick.start.toISOString(),
      unlockLabel: formatModuleUnlockWhen(
        pick.enrollment.session?.starts_at ?? pick.start.toISOString(),
        pick.enrollment.session?.timezone,
      ),
      enrollmentId: pick.enrollment.id,
      session: pick.enrollment.session,
    };
  }

  const upcoming = dated.sort((a, b) => a.start.getTime() - b.start.getTime())[0];
  const fallback = upcoming?.enrollment ?? relevant[0];
  return {
    enrolled: true,
    unlocked: false,
    unlocksAt: upcoming?.start.toISOString() ?? null,
    unlockLabel: formatModuleUnlockWhen(
      fallback.session?.starts_at ?? null,
      fallback.session?.timezone,
    ),
    enrollmentId: fallback.id,
    session: fallback.session,
  };
}

export function canOpenCourseModules(access: CourseModuleAccess) {
  return access.enrolled && access.unlocked && Boolean(access.enrollmentId);
}

export async function getEnrolledModuleCourses(studentId: string) {
  const enrollments = await getMemberEnrollments(studentId);
  const byCourse = new Map<string, ModuleCourseCard>();

  for (const enrollment of enrollments) {
    const course = enrollment.course;
    if (!course?.id || !course.slug || !QUALIFYING.has(enrollment.status)) {
      continue;
    }
    if (byCourse.has(course.id)) continue;
    const access = courseModuleAccess(enrollments, course.id);
    if (!access.enrolled || !access.enrollmentId) continue;
    byCourse.set(course.id, {
      courseId: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      unlocked: access.unlocked,
      unlocksAt: access.unlocksAt,
      unlockLabel: access.unlockLabel,
      enrollmentId: access.enrollmentId,
    });
  }

  return [...byCourse.values()].sort((a, b) => a.title.localeCompare(b.title));
}

export async function getStudentCourseModules(studentId: string, slug: string) {
  const enrollments = await getMemberEnrollments(studentId);
  const match = enrollments.find(
    (enrollment) =>
      enrollment.course?.slug === slug && QUALIFYING.has(enrollment.status),
  );
  const course = match?.course;
  if (!course?.id || !course.slug) {
    return {
      course: null as null,
      access: courseModuleAccess(enrollments, ""),
      modules: [] as StudentModuleListItem[],
    };
  }

  const access = courseModuleAccess(enrollments, course.id);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_modules")
    .select("id, title, description, sort_order")
    .eq("course_id", course.id)
    .eq("status", "PUBLISHED")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getStudentCourseModules", error.message);
  }

  return {
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
    },
    access,
    modules: (data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: (row.description as string | null) ?? null,
      sortOrder: Number(row.sort_order ?? 0),
    })),
  };
}

export async function getStudentModulePlayer(
  studentId: string,
  slug: string,
  moduleId: string,
) {
  const { course, access, modules } = await getStudentCourseModules(
    studentId,
    slug,
  );
  if (!course) {
    return { course: null, module: null, access, files: [], quiz: [], latestAttempt: null };
  }

  const listed = modules.find((item) => item.id === moduleId);
  if (!listed) {
    return { course, module: null, access, files: [], quiz: [], latestAttempt: null };
  }

  const lesson = {
    id: listed.id,
    title: listed.title,
    description: listed.description,
  };

  if (!canOpenCourseModules(access)) {
    return { course, module: lesson, access, files: [], quiz: [], latestAttempt: null };
  }

  const admin = createServiceClient();
  const [{ data: fileRows }, { data: questionRows }, { data: attemptRows }] =
    await Promise.all([
      admin
        .from("course_module_files")
        .select("id, file_name, mime_type, byte_size, storage_path, sort_order")
        .eq("module_id", moduleId)
        .order("sort_order", { ascending: true }),
      admin
        .from("course_module_quiz_questions")
        .select("id, prompt, sort_order, course_module_quiz_options(id, label, sort_order)")
        .eq("module_id", moduleId)
        .order("sort_order", { ascending: true }),
      (await createClient())
        .from("course_module_quiz_attempts")
        .select("score, total, submitted_at")
        .eq("student_id", studentId)
        .eq("module_id", moduleId)
        .order("submitted_at", { ascending: false })
        .limit(1),
    ]);

  const files: StudentModuleFile[] = [];
  for (const row of fileRows ?? []) {
    const path = row.storage_path as string;
    const { data: signed } = await admin.storage
      .from(MODULE_FILES_BUCKET)
      .createSignedUrl(path, MODULE_FILE_SIGNED_TTL_SECONDS);
    files.push({
      id: row.id as string,
      fileName: row.file_name as string,
      mimeType: row.mime_type as string,
      byteSize: Number(row.byte_size),
      url: signed?.signedUrl ?? null,
    });
  }

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
      | { score: number; total: number; submitted_at: string }
      | { score: number; total: number; submitted_at: string }[]
      | null,
  );

  return {
    course,
    module: lesson,
    access,
    files,
    quiz,
    latestAttempt: latest
      ? {
          score: Number(latest.score),
          total: Number(latest.total),
          submittedAt: latest.submitted_at,
        }
      : null,
  };
}
