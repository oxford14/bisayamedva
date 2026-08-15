import { createClient } from "@/lib/supabase/server";
import { upsertCourse } from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import {
  AdminPageHeader,
  AdminTable,
  EmptyState,
  StatusBadge,
} from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <AdminPageHeader
        title="Courses"
        description="Publish BASIC and Upskill course offers with pricing."
      />

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        {(courses ?? []).length === 0 ? (
          <EmptyState
            title="No courses"
            body="Create the first course to start scheduling sessions."
          />
        ) : (
          <AdminTable
            headers={["Course", "Type", "Price", "Status", "Sort"]}
          >
            {(courses ?? []).map((course) => (
              <tr key={course.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{course.title}</div>
                  <div className="text-xs text-muted">{course.slug}</div>
                </td>
                <td className="px-4 py-3">{course.course_type}</td>
                <td className="px-4 py-3">
                  ₱{Number(course.price).toLocaleString()} {course.currency}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={course.status} />
                </td>
                <td className="px-4 py-3">{course.sort_order}</td>
              </tr>
            ))}
          </AdminTable>
        )}

        <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="font-semibold">Create / update course</h2>
          <p className="mt-1 text-sm text-muted">
            Leave ID blank to create. Paste an existing course ID to update.
          </p>
          <ActionForm action={upsertCourse} className="mt-4 space-y-3" submitLabel="Save course">
            <Field label="Course ID (optional for update)" htmlFor="id">
              <Input id="id" name="id" placeholder="uuid" />
            </Field>
            <Field label="Slug" htmlFor="slug">
              <Input id="slug" name="slug" required placeholder="medical-billing-training" />
            </Field>
            <Field label="Title" htmlFor="title">
              <Input id="title" name="title" required />
            </Field>
            <Field label="Subtitle" htmlFor="subtitle">
              <Input id="subtitle" name="subtitle" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Type" htmlFor="course_type">
                <select
                  id="course_type"
                  name="course_type"
                  className="flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5"
                  defaultValue="BASIC"
                >
                  <option value="BASIC">BASIC</option>
                  <option value="UPSKILL">UPSKILL</option>
                </select>
              </Field>
              <Field label="Status" htmlFor="status">
                <select
                  id="status"
                  name="status"
                  className="flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5"
                  defaultValue="DRAFT"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Price" htmlFor="price">
                <Input id="price" name="price" type="number" min="0" step="1" required defaultValue="200" />
              </Field>
              <Field label="Sort order" htmlFor="sort_order">
                <Input id="sort_order" name="sort_order" type="number" defaultValue="0" />
              </Field>
            </div>
            <input type="hidden" name="currency" value="PHP" />
            <Field label="Description" htmlFor="description">
              <textarea
                id="description"
                name="description"
                className="min-h-24 w-full rounded-[10px] border border-border bg-white px-3.5 py-3 text-sm"
              />
            </Field>
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
