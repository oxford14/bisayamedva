"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { upsertCourseModule } from "@/app/(admin)/admin/modules-actions";
import { Field, selectClassName } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ModuleCreateForm({
  courses,
}: {
  courses: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setError("");
        startTransition(async () => {
          const result = await upsertCourseModule(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push(`/admin/modules/${result.id}`);
        });
      }}
    >
      <Field label="Course" htmlFor="course_id">
        <select
          id="course_id"
          name="course_id"
          required
          className={selectClassName}
          defaultValue={courses[0]?.id ?? ""}
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Title" htmlFor="title">
        <Input id="title" name="title" required placeholder="Week 1 · Eligibility basics" />
      </Field>
      <Field label="Description (optional)" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full rounded-[10px] border border-border bg-white px-3.5 py-3 text-base text-ink focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/25 focus-visible:outline-none"
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Sort" htmlFor="sort_order">
          <Input id="sort_order" name="sort_order" type="number" defaultValue={0} />
        </Field>
        <Field label="Status" htmlFor="status">
          <select
            id="status"
            name="status"
            className={selectClassName}
            defaultValue="DRAFT"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </Field>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="accent" disabled={pending || courses.length === 0}>
        {pending ? "Saving..." : "Create module"}
      </Button>
    </form>
  );
}
