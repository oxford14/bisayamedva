import { createClient } from "@/lib/supabase/server";
import { saveContentSettings } from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { Field } from "@/components/forms/field";

export default async function ContentPage() {
  const supabase = await createClient();
  const [{ data: settings }, { data: courses }, { data: sessions }] =
    await Promise.all([
      supabase.from("site_settings").select("key, value"),
      supabase
        .from("courses")
        .select("id, title, status")
        .order("sort_order"),
      supabase
        .from("sessions")
        .select("id, title, status, starts_at")
        .order("starts_at", { ascending: true }),
    ]);

  const map = Object.fromEntries(
    (settings ?? []).map((row) => [row.key, row.value]),
  );
  const featured =
    typeof map.featured_course_id === "string"
      ? map.featured_course_id
      : map.featured_course_id
        ? String(map.featured_course_id).replaceAll('"', "")
        : "";
  const nextSession =
    typeof map.next_session_id === "string"
      ? map.next_session_id
      : map.next_session_id
        ? String(map.next_session_id).replaceAll('"', "")
        : "";

  return (
    <div>
      <AdminPageHeader
        title="Content"
        description="Choose which published course and session appear on the public site."
      />

      <div className="max-w-xl rounded-2xl border border-border bg-white p-5">
        <ActionForm action={saveContentSettings} submitLabel="Save content settings">
          <div className="space-y-4">
            <Field label="Featured course" htmlFor="featured_course_id">
              <select
                id="featured_course_id"
                name="featured_course_id"
                defaultValue={featured}
                className="flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5"
              >
                <option value="">Use site.ts fallback</option>
                {(courses ?? []).map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title} ({course.status})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Next session" htmlFor="next_session_id">
              <select
                id="next_session_id"
                name="next_session_id"
                defaultValue={nextSession}
                className="flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5"
              >
                <option value="">Use site.ts fallback</option>
                {(sessions ?? []).map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title} —{" "}
                    {new Date(session.starts_at).toLocaleString()} ({session.status})
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
