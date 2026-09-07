export type UserRole = "SUPER_ADMIN" | "ADMIN" | "STUDENT";

export function isAdminRole(role: string | null | undefined) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function isStudentRole(role: string | null | undefined) {
  return role === "STUDENT";
}

export function canAccessMemberApp(role: string | null | undefined) {
  return isStudentRole(role) || isAdminRole(role);
}
