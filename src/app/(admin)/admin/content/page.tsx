import { saveContentSettings } from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import {
  ContentSettingsFields,
  type ContentCourseOption,
} from "@/components/admin/content-settings-fields";
import { AdminPageHeader } from "@/components/admin/ui";
import { getLiveSessionSchedule } from "@/lib/live-session/schedule";
import { createClient } from "@/lib/supabase/server";

function unwrapSetting(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.replace(/^"|"$/g, "");
  return String(value).replaceAll('"', "");
}

export default async function ContentPage() {
  const supabase = await createClient();

  const [{ data: settings }, { data: publishedCourses }, schedule] =
    await Promise.all([
      supabase.from("site_settings").select("key, value"),
      supabase
        .from("courses")
        .select("id, title")
        .eq("status", "PUBLISHED")
        .order("sort_order"),
      getLiveSessionSchedule(),
    ]);

  const map = Object.fromEntries(
    (settings ?? []).map((row) => [row.key, row.value]),
  );
  const featured = unwrapSetting(map.featured_course_id);

  const courses: ContentCourseOption[] = [...(publishedCourses ?? [])];
  if (featured && !courses.some((course) => course.id === featured)) {
    const { data: currentCourse } = await supabase
      .from("courses")
      .select("id, title")
      .eq("id", featured)
      .maybeSingle();
    if (currentCourse) courses.unshift(currentCourse);
  }

  return (
    <div>
      <AdminPageHeader
        title="Content"
        description="Choose the featured course and set the recurring weekend live session shown on the public site and to every student."
      />

      <div className="max-w-xl rounded-2xl border border-border bg-white p-5">
        <ActionForm action={saveContentSettings} submitLabel="Save content settings">
          <ContentSettingsFields
            courses={courses}
            featuredCourseId={featured}
            schedule={schedule}
          />
        </ActionForm>
      </div>
    </div>
  );
}
