import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  AdminPageHeader,
  AdminTable,
  EmptyState,
  StatusBadge,
} from "@/components/admin/ui";
import { ModuleCreateForm } from "@/components/admin/module-create-form";

type Props = {
  searchParams: Promise<{ course?: string }>;
};

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
        {(modules ?? []).length === 0 ? (
          <EmptyState
            title="No modules"
            body="Create a module, then upload files and add a quiz."
          />
        ) : (
          <AdminTable headers={["Module", "Course", "Status", "Files", "Quiz", ""]}>
            {(modules ?? []).map((row) => {
              const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
              const fileCount = Array.isArray(row.course_module_files)
                ? row.course_module_files.length
                : 0;
              const questionCount = Array.isArray(row.course_module_quiz_questions)
                ? row.course_module_quiz_questions.length
                : 0;
              return (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.title}</div>
                    <div className="text-xs text-muted">Sort {row.sort_order}</div>
                  </td>
                  <td className="px-4 py-3">{course?.title ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">{fileCount}</td>
                  <td className="px-4 py-3">{questionCount}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/modules/${row.id}`}
                      className="text-sm font-semibold text-navy hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </AdminTable>
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
