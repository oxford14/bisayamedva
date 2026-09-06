import { modulesCopy } from "@/content/site";
import { MemberPageHeader } from "@/components/member/ui";
import { ModulesCatalog } from "@/components/member/modules-catalog";
import { getEnrolledModuleCourses } from "@/lib/member/modules";
import { getStudentProfile, isAdminRole } from "@/lib/supabase/auth";

type Props = {
  searchParams: Promise<{ course?: string }>;
};

export default async function MemberModulesPage({ searchParams }: Props) {
  const profile = await getStudentProfile();
  const { course } = await searchParams;
  const courses = await getEnrolledModuleCourses(profile.id, profile.role);
  const firstName =
    profile.full_name.split(/\s+/).filter(Boolean)[0] ?? "ka";

  return (
    <div>
      <MemberPageHeader
        title={`Maayong adlaw, ${firstName}`}
        description={
          isAdminRole(profile.role)
            ? modulesCopy.staffPreview
            : modulesCopy.dashboardDescription
        }
      />
      <ModulesCatalog
        courses={courses}
        activeSlug={course}
        staffPreview={isAdminRole(profile.role)}
      />
    </div>
  );
}