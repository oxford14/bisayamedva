import { memberNav, type MemberNavItem } from "@/components/member/nav-config";
import { isStudentRole } from "@/lib/supabase/roles";

const PRACTICE_HREF = "/member/practice";

/** Scenario students may run in Mock Call; other scenarios are visible but disabled. */
export const MOCK_CALL_STUDENT_SCENARIO_ID = "basic-call-flow-training";

export function canAccessPracticeLab(role: string | null | undefined) {
  return role === "SUPER_ADMIN" || isStudentRole(role);
}

export function canAccessAllMockCallScenarios(role: string | null | undefined) {
  return role === "SUPER_ADMIN";
}

export function isMockCallScenarioAllowed(
  scenarioId: string,
  role: string | null | undefined,
) {
  if (canAccessAllMockCallScenarios(role)) return true;
  return scenarioId === MOCK_CALL_STUDENT_SCENARIO_ID;
}

export function getMemberNavForRole(
  role: string | null | undefined,
): MemberNavItem[] {
  const showPractice = canAccessPracticeLab(role);
  return memberNav.filter(
    (item) => item.href !== PRACTICE_HREF || showPractice,
  );
}
