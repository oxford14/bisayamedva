import { MemberCourseCatalog } from "@/components/member/course-catalog";
import { MemberPageHeader } from "@/components/member/ui";
import { getMemberEnrollments } from "@/lib/member/data";
import { requireStudent } from "@/lib/supabase/auth";

export default async function MemberCoursePage() {
  const profile = await requireStudent();
  const enrollments = await getMemberEnrollments(profile.id);

  return (
    <div>
      <MemberPageHeader
        title="My Courses"
        description="Browse the Core Beginner bundle and the Full MedVA Deep Dive path — klaro kung unsa ang included, ug unsa ang locked pa."
      />
      <MemberCourseCatalog enrollments={enrollments} />
    </div>
  );
}
