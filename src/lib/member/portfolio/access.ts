import { canAccessStudentLounge } from "@/lib/member/data";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { isAdminRole } from "@/lib/supabase/roles";

export const PORTFOLIO_ENROLL_MESSAGE =
  "Enroll sa usa ka session una para ma-open ang Portfolio Builder.";

export async function requirePortfolioStudent() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return {
      profile: null as null,
      error: { ok: false as const, message: "Please log in to continue." },
    };
  }
  if (isAdminRole(profile.role)) {
    return {
      profile: {
        id: profile.id,
        role: profile.role,
        full_name: profile.full_name,
        occupation: profile.occupation,
        avatar_path: profile.avatar_path,
      },
      error: null,
    };
  }
  const allowed = await canAccessStudentLounge(profile.id, profile.role);
  if (!allowed) {
    return {
      profile: null as null,
      error: { ok: false as const, message: PORTFOLIO_ENROLL_MESSAGE },
    };
  }
  return {
    profile: {
      id: profile.id,
      role: profile.role,
      full_name: profile.full_name,
      occupation: profile.occupation,
      avatar_path: profile.avatar_path,
    },
    error: null,
  };
}

export async function canAccessPortfolio(
  studentId: string,
  role: string | null | undefined,
) {
  if (isAdminRole(role)) return true;
  return canAccessStudentLounge(studentId, role);
}
