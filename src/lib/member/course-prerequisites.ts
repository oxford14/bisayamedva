import { memberCoursesCopy } from "@/content/site";
import { createServiceClient } from "@/lib/supabase/admin";
import type { MemberEnrollment } from "@/lib/member/enrollment-shared";

export const BILLING_SLUG = "medical-billing-masterclass";
export const VA_SLUG = "medical-va-masterclass";

const VA_QUALIFYING = new Set(["ACTIVE", "COMPLETED"]);

export function billingCheckoutRequiresVa(slug: string) {
  return slug === BILLING_SLUG;
}

type EnrollmentSlugRow = {
  status: string;
  course: { slug: string | null } | null;
};

export function studentMeetsBillingPrerequisite(
  enrollments: EnrollmentSlugRow[] | Pick<MemberEnrollment, "status" | "course">[],
): boolean {
  return enrollments.some(
    (row) =>
      row.course?.slug === VA_SLUG && VA_QUALIFYING.has(row.status),
  );
}

/** Server checkout: hard gate before review or wallet debit. */
export async function ensureBillingPrerequisite(
  slug: string,
  studentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!billingCheckoutRequiresVa(slug)) return { ok: true };

  const admin = createServiceClient();
  const { data, error } = await admin
    .from("enrollments")
    .select("status, courses(slug)")
    .eq("student_id", studentId)
    .in("status", ["ACTIVE", "COMPLETED", "PENDING_PAYMENT"]);

  if (error) {
    return {
      ok: false,
      error: "Could not verify course prerequisites. Try again later.",
    };
  }

  const rows = (data ?? []).map((row) => {
    const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
    return {
      status: row.status as string,
      course: course ? { slug: course.slug as string | null } : null,
    };
  });

  if (studentMeetsBillingPrerequisite(rows)) return { ok: true };

  return { ok: false, error: memberCoursesCopy.billingPrerequisiteCheckoutError };
}
