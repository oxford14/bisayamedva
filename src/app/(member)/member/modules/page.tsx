import { modulesCopy } from "@/content/site";
import { MemberPageHeader } from "@/components/member/ui";
import { ModulesCatalog } from "@/components/member/modules-catalog";
import { getEnrolledModuleCourses } from "@/lib/member/modules";
import { getStudentProfile } from "@/lib/supabase/auth";

type Props = {
  searchParams: Promise<{ course?: string }>;
};

export default async function MemberModulesPage({ searchParams }: Props) {
  const profile = await getStudentProfile();
  const { course } = await searchParams;
  const courses = await getEnrolledModuleCourses(profile.id);

  return (
    <div>
      <MemberPageHeader
        title={modulesCopy.title}
        description={modulesCopy.description}
      />
      <ModulesCatalog courses={courses} activeSlug={course} />
    </div>
  );
}
