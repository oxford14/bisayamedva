export const MODULE_ACCESS_QUALIFYING_STATUSES = [
  "ACTIVE",
  "COMPLETED",
] as const;

export type ModuleAccessQualifyingStatus =
  (typeof MODULE_ACCESS_QUALIFYING_STATUSES)[number];

export function qualifyingEnrollmentStatus(
  status: string,
): status is ModuleAccessQualifyingStatus {
  return (
    status === "ACTIVE" ||
    status === "COMPLETED"
  );
}

/** Paid / activated enrollment — modules open without waiting for session start. */
export function modulesUnlockedForEnrollment(status: string): boolean {
  return qualifyingEnrollmentStatus(status);
}
