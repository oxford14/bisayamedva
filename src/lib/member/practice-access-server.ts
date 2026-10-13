import { hasPaidCourseAccess } from "@/lib/member/data";
import { canAccessPracticeLab } from "@/lib/member/practice-access";
import { isStudentRole } from "@/lib/supabase/roles";

export type PracticeLabAccess = "allowed" | "needs-course" | "staff-preview";

/** Practice Lab: SUPER_ADMIN, or a student with a paid course. Free accounts get the enroll gate. */
export async function getPracticeLabAccess(profile: {
  id: string;
  role: string | null | undefined;
}): Promise<PracticeLabAccess> {
  if (!canAccessPracticeLab(profile.role)) return "staff-preview";
  if (!isStudentRole(profile.role)) return "allowed";
  return (await hasPaidCourseAccess(profile.id, profile.role))
    ? "allowed"
    : "needs-course";
}
