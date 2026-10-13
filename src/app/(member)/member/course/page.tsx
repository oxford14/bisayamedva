import { MemberCourseCatalog } from "@/components/member/course-catalog";
import { MemberPageHeader } from "@/components/member/ui";
import { getMemberEnrollments } from "@/lib/member/data";
import { getStudentProfile } from "@/lib/supabase/auth";

export default async function MemberCoursePage() {
  const profile = await getStudentProfile();
  const enrollments = await getMemberEnrollments(profile.id);

  return (
    <div>
      <MemberPageHeader
        title="My Courses"
        description="Free ang weekend live session. Enroll in a course para ma-unlock ang modules, Practice Lab, ug certificate."
      />
      <MemberCourseCatalog enrollments={enrollments} />
    </div>
  );
}
