/** Client-safe enrollment types and helpers (no Supabase server imports). */

export type MemberCourse = {
  id: string;
  title: string;
  slug: string | null;
  subtitle: string | null;
  description: string | null;
  course_type: string | null;
  price: number | null;
  currency: string | null;
  sort_order: number | null;
};

export type MemberSession = {
  id: string;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
  timezone: string | null;
  format: string | null;
  meeting_url: string | null;
  status: string | null;
};

export type MemberPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
  provider_payment_id: string | null;
  created_at: string;
};

export type MemberEnrollment = {
  id: string;
  status: string;
  created_at: string;
  course: MemberCourse | null;
  session: MemberSession | null;
  payment: MemberPayment | null;
};

export function isMemberPaidEnrollment(enrollment: MemberEnrollment) {
  return (
    enrollment.status === "ACTIVE" ||
    enrollment.status === "COMPLETED" ||
    enrollment.payment?.status === "PAID"
  );
}

export function isSessionStartPast(startsAt: string | null | undefined) {
  if (!startsAt) return false;
  return new Date(startsAt).getTime() <= Date.now();
}

export function isAssignedSessionStarted(enrollment: MemberEnrollment) {
  return isSessionStartPast(enrollment.session?.starts_at);
}

/** After assigned session start — another date needs paid re-enrollment. */
export function requiresPaidReenrollment(enrollment: MemberEnrollment) {
  return isMemberPaidEnrollment(enrollment) && isAssignedSessionStarted(enrollment);
}
