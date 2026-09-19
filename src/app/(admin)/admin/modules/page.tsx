import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  AdminModulesTable,
  type AdminModuleRow,
} from "@/components/admin/admin-modules-table";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { ModuleCreateForm } from "@/components/admin/module-create-form";

type Props = {
  searchParams: Promise<{ course?: string }>;
};

type ModuleQueryRow = {
  id: string;
  title: string;
  status: string;
  sort_order: number;
  course_id: string;
  courses: { title: string; slug: string } | { title: string; slug: string }[] | null;
  course_module_files: { id: string }[] | null;
  course_module_quiz_questions: { id: string }[] | null;
};

function toAdminRow(row: ModuleQueryRow): AdminModuleRow {
  const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    sortOrder: Number(row.sort_order ?? 0),
    courseId: row.course_id,
    courseTitle: course?.title ?? "",
    fileCount: Array.isArray(row.course_module_files)
      ? row.course_module_files.length
      : 0,
    questionCount: Array.isArray(row.course_module_quiz_questions)
      ? row.course_module_quiz_questions.length
      : 0,
  };
}

function sortModulesForDisplay(rows: AdminModuleRow[], courseFilter: boolean) {
  const sorted = [...rows];
  if (courseFilter) {
    sorted.sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
    );
  } else {
    sorted.sort(
      (a, b) =>
        a.courseTitle.localeCompare(b.courseTitle) ||
        a.sortOrder - b.sortOrder ||
        a.title.localeCompare(b.title),
    );
  }
  return sorted;
}

export default async function AdminModulesPage({ searchParams }: Props) {
  const { course: courseId } = await searchParams;
  const supabase = await createClient();

  let modulesQuery = supabase
    .from("course_modules")
    .select(
      "id, title, status, sort_order, course_id, courses(title, slug), course_module_files(id), course_module_quiz_questions(id)",
    )
    .order("sort_order", { ascending: true });
  if (courseId) modulesQuery = modulesQuery.eq("course_id", courseId);

  const [{ data: modules }, { data: courses }] = await Promise.all([
    modulesQuery,
    supabase
      .from("courses")
      .select("id, title")
      .neq("status", "ARCHIVED")
      .order("title"),
  ]);

  const moduleRows = sortModulesForDisplay(
    (modules ?? []).map((row) => toAdminRow(row as ModuleQueryRow)),
    Boolean(courseId),
  );

  return (
    <div>
      <AdminPageHeader
        title="Modules"
        description="Upload lesson files and multiple-choice quizzes per course. Students unlock them at Zoom start."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          href="/admin/modules"
          className={
            !courseId
              ? "rounded-full border border-navy bg-navy px-3 py-1.5 text-xs font-semibold tracking-wide uppercase text-cream"
              : "rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold tracking-wide uppercase text-navy/70 hover:bg-sand"
          }
        >
          All courses
        </Link>
        {(courses ?? []).map((course) => (
          <Link
            key={course.id}
            href={`/admin/modules?course=${course.id}`}
            className={
              courseId === course.id
                ? "rounded-full border border-navy bg-navy px-3 py-1.5 text-xs font-semibold tracking-wide uppercase text-cream"
                : "rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold tracking-wide uppercase text-navy/70 hover:bg-sand"
            }
          >
            {course.title}
          </Link>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        {moduleRows.length === 0 ? (
          <EmptyState
            title="No modules"
            body="Create a module, then upload files and add a quiz."
          />
        ) : (
          <AdminModulesTable modules={moduleRows} />
        )}

        <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="font-semibold">Create module</h2>
          <p className="mt-1 text-sm text-muted">
            After you save, upload files and build the quiz on the next screen.
          </p>
          <div className="mt-4">
            <ModuleCreateForm courses={courses ?? []} />
          </div>
        </div>
      </div>
    </div>
  );
}
