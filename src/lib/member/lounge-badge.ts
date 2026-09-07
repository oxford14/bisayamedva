export type LoungeBadge = "COACH" | "ADMIN" | "FACILITATOR" | "IT_HEAD";

export const LOUNGE_BADGES = [
  "COACH",
  "ADMIN",
  "FACILITATOR",
  "IT_HEAD",
] as const;

export const LOUNGE_BADGE_LABELS: Record<LoungeBadge, string> = {
  COACH: "Coach",
  ADMIN: "Admin",
  FACILITATOR: "Facilitator",
  IT_HEAD: "IT Head",
};

export function isLoungeBadge(
  value: string | null | undefined,
): value is LoungeBadge {
  return (
    value === "COACH" ||
    value === "ADMIN" ||
    value === "FACILITATOR" ||
    value === "IT_HEAD"
  );
}
