import { isAdminRole } from "@/lib/supabase/roles";

export function canDeleteUser(
  actorRole: string | null | undefined,
  actorId: string | null | undefined,
  targetRole: string,
  targetId: string,
) {
  if (!actorRole || !isAdminRole(actorRole) || !actorId || actorId === targetId) {
    return false;
  }
  if (targetRole === "ADMIN" || targetRole === "SUPER_ADMIN") {
    return actorRole === "SUPER_ADMIN";
  }
  return true;
}
