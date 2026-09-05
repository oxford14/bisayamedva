import { MemberCourseCatalog } from "@/components/member/course-catalog";
import { MemberPageHeader } from "@/components/member/ui";
import { getMemberEnrollments } from "@/lib/member/data";
import { getOpenFutureSessions } from "@/lib/member/open-sessions";
import { getStudentProfile } from "@/lib/supabase/auth";

export default async function MemberCoursePage() {
  const profile = await getStudentProfile();
  const [enrollments, openSessions] = await Promise.all([
    getMemberEnrollments(profile.id),
    getOpenFutureSessions(),
  ]);

  return (
    <div>
      <MemberPageHeader
        title="My Courses"
        description="Browse Foundation and Upskill courses — enroll and pick an open weekend schedule."
      />
      <MemberCourseCatalog
        enrollments={enrollments}
        openSessions={openSessions}
      />
    </div>
  );
}
