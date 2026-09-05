import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { upsertCourseModule } from "@/app/(admin)/admin/modules-actions";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { ModuleDeleteForm } from "@/components/admin/module-delete-form";
import { ModuleFilesEditor } from "@/components/admin/module-files-editor";
import { ModuleQuizEditor } from "@/components/admin/module-quiz-editor";
import { Field, selectClassName } from "@/components/forms/field";
import { Input } from "@/components/ui/input";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminModuleEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: module }, { data: courses }] = await Promise.all([
    supabase
      .from("course_modules")
      .select(
        "id, course_id, title, description, sort_order, status, course_module_files(id, file_name, mime_type, byte_size, sort_order), course_module_quiz_questions(id, prompt, sort_order, course_module_quiz_options(id, label, is_correct, sort_order))",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("courses")
      .select("id, title, status")
      .order("title"),
  ]);

  if (!module) notFound();

  const files = (
    (module.course_module_files as
      | {
          id: string;
          file_name: string;
          mime_type: string;
          byte_size: number;
          sort_order: number;
        }[]
      | null) ?? []
  )
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((file) => ({
      id: file.id,
      fileName: file.file_name,
      mimeType: file.mime_type,
      byteSize: Number(file.byte_size),
    }));

  const questions = (
    (module.course_module_quiz_questions as
      | {
          id: string;
          prompt: string;
          sort_order: number;
          course_module_quiz_options:
            | { id: string; label: string; is_correct: boolean; sort_order: number }[]
            | null;
        }[]
      | null) ?? []
  )
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((question) => ({
      id: question.id,
      prompt: question.prompt,
      options: (question.course_module_quiz_options ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((option) => ({
          id: option.id,
          label: option.label,
          isCorrect: option.is_correct,
        })),
    }));

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={module.title}
        description="Update details, upload lesson files, and build the multiple-choice quiz."
        actions={
          <Link
            href="/admin/modules"
            className="text-sm font-semibold text-navy hover:underline"
          >
            Back to modules
          </Link>
        }
      />

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="font-semibold">Module details</h2>
          <ActionForm action={upsertCourseModule} className="mt-4 space-y-3">
            <input type="hidden" name="id" value={module.id} />
            <Field label="Course" htmlFor="course_id">
              <select
                id="course_id"
                name="course_id"
                className={selectClassName}
                defaultValue={module.course_id}
              >
                {(courses ?? [])
                  .filter(
                    (course) =>
                      course.status !== "ARCHIVED" || course.id === module.course_id,
                  )
                  .map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Title" htmlFor="title">
              <Input id="title" name="title" required defaultValue={module.title} />
            </Field>
            <Field label="Description" htmlFor="description">
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={module.description ?? ""}
                className="w-full rounded-[10px] border border-border bg-white px-3.5 py-3 text-base text-ink focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/25 focus-visible:outline-none"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Sort" htmlFor="sort_order">
                <Input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  defaultValue={module.sort_order}
                />
              </Field>
              <Field label="Status" htmlFor="status">
                <select
                  id="status"
                  name="status"
                  className={selectClassName}
                  defaultValue={module.status}
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </Field>
            </div>
          </ActionForm>
          <ModuleDeleteForm moduleId={module.id} />
        </section>

        <div className="space-y-8">
          <section className="rounded-2xl border border-border bg-white p-5">
            <h2 className="font-semibold">Lesson files</h2>
            <p className="mt-1 text-sm text-muted">
              Upload PDFs, videos, or documents. Students get signed links after Zoom start.
            </p>
            <div className="mt-4">
              <ModuleFilesEditor moduleId={module.id} files={files} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <h2 className="font-semibold">Quiz</h2>
            <p className="mt-1 text-sm text-muted">
              Multiple choice. One correct answer per question. Students can retake.
            </p>
            <div className="mt-4">
              <ModuleQuizEditor moduleId={module.id} questions={questions} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
