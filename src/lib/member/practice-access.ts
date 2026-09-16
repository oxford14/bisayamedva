import { memberNav, type MemberNavItem } from "@/components/member/nav-config";

const PRACTICE_HREF = "/member/practice";

/** Practice Lab is SUPER_ADMIN preview until rolled out to enrolled students. */
export function canAccessPracticeLab(role: string | null | undefined) {
  return role === "SUPER_ADMIN";
}

export function getMemberNavForRole(
  role: string | null | undefined,
): MemberNavItem[] {
  const showPractice = canAccessPracticeLab(role);
  return memberNav.filter(
    (item) => item.href !== PRACTICE_HREF || showPractice,
  );
}
