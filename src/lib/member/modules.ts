import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole, type UserRole } from "@/lib/supabase/auth";
import {
  getMemberEnrollments,
  type MemberEnrollment,
  type MemberSession,
} from "@/lib/member/data";
import { moduleFileHref } from "@/lib/member/module-player-shared";
import {
  mapQuizReviewQuestions,
  toStudentQuizAttempt,
  type StudentQuizReviewItem,
} from "@/lib/member/quiz-review";

export type { StudentQuizReviewItem };

const QUALIFYING = new Set(["ACTIVE", "COMPLETED"]);

export type CourseModuleAccess = {
  enrolled: boolean;
  unlocked: boolean;
  unlocksAt: string | null;
  unlockLabel: string | null;
  enrollmentId: string | null;
  session: MemberSession | null;
  staffPreview: boolean;
};

export type ModuleCourseCard = {
  courseId: string;
  slug: string;
  title: string;
  subtitle: string | null;
  unlocked: boolean;
  unlocksAt: string | null;
  unlockLabel: string | null;
  enrollmentId: string | null;
  sortOrder: number;
};

export type StudentModuleListItem = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
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
  review: StudentQuizReviewItem[];
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
      staffPreview: false,
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
      staffPreview: false,
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
    staffPreview: false,
  };
}

export function staffModuleAccess(): CourseModuleAccess {
  return {
    enrolled: true,
    unlocked: true,
    unlocksAt: null,
    unlockLabel: null,
    enrollmentId: null,
    session: null,
    staffPreview: true,
  };
}

export function canOpenCourseModules(access: CourseModuleAccess) {
  if (access.staffPreview) return true;
  return access.enrolled && access.unlocked && Boolean(access.enrollmentId);
}

async function getStaffModuleCourses() {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("courses")
    .select("id, slug, title, subtitle, sort_order")
    .neq("status", "ARCHIVED")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  if (error) {
    console.error("getStaffModuleCourses", error.message);
    return [] as ModuleCourseCard[];
  }
  return (data ?? [])
    .filter((course) => Boolean(course.slug))
    .map((course) => ({
      courseId: course.id as string,
      slug: course.slug as string,
      title: course.title as string,
      subtitle: (course.subtitle as string | null) ?? null,
      unlocked: true,
      unlocksAt: null,
      unlockLabel: null,
      enrollmentId: null,
      sortOrder: Number(course.sort_order ?? 0),
    }));
}

function mapModuleRows(
  data:
    | {
        id: string;
        title: string;
        description: string | null;
        sort_order: number;
        status?: string;
      }[]
    | null,
): StudentModuleListItem[] {
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    sortOrder: Number(row.sort_order ?? 0),
    status:
      row.status === "DRAFT" || row.status === "ARCHIVED"
        ? row.status
        : "PUBLISHED",
  }));
}

export async function getEnrolledModuleCourses(
  studentId: string,
  role?: UserRole | null,
) {
  if (isAdminRole(role)) return getStaffModuleCourses();

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
      sortOrder: Number(course.sort_order ?? 0),
    });
  }

  return [...byCourse.values()].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.title.localeCompare(b.title);
  });
}

export async function getStudentCourseModules(
  studentId: string,
  slug: string,
  role?: UserRole | null,
) {
  if (isAdminRole(role)) {
    const admin = createServiceClient();
    const { data: course } = await admin
      .from("courses")
      .select("id, slug, title, subtitle")
      .eq("slug", slug)
      .neq("status", "ARCHIVED")
      .maybeSingle();
    if (!course?.id || !course.slug) {
      return {
        course: null as null,
        access: staffModuleAccess(),
        modules: [] as StudentModuleListItem[],
      };
    }
    const { data, error } = await admin
      .from("course_modules")
      .select("id, title, description, sort_order, status")
      .eq("course_id", course.id)
      .in("status", ["DRAFT", "PUBLISHED"])
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("getStudentCourseModules", error.message);
    }
    return {
      course: {
        id: course.id as string,
        slug: course.slug as string,
        title: course.title as string,
        subtitle: (course.subtitle as string | null) ?? null,
      },
      access: staffModuleAccess(),
      modules: mapModuleRows(data),
    };
  }

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
    .select("id, title, description, sort_order, status")
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
    modules: mapModuleRows(data),
  };
}

export async function getStudentModulePlayer(
  studentId: string,
  slug: string,
  moduleId: string,
  role?: UserRole | null,
) {
  const { course, access, modules } = await getStudentCourseModules(
    studentId,
    slug,
    role,
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
    status: listed.status,
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

  const files: StudentModuleFile[] = [];
  for (const row of fileRows ?? []) {
    files.push({
      id: row.id as string,
      fileName: row.file_name as string,
      mimeType: row.mime_type as string,
      byteSize: Number(row.byte_size),
      url: moduleFileHref(row.id as string),
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
      | { score: number; total: number; submitted_at: string; answers: unknown }
      | { score: number; total: number; submitted_at: string; answers: unknown }[]
      | null,
  );

  return {
    course,
    module: lesson,
    access,
    files,
    quiz,
    latestAttempt: latest
      ? toStudentQuizAttempt(latest, mapQuizReviewQuestions(questionRows))
      : null,
  };
}
