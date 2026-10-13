import { certificatesCopy, certificatesEnabled } from "@/content/site";
import { formatSessionWhenLabel } from "@/lib/datetime";
import { isAdminRole, type UserRole } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPeso } from "@/lib/utils";

export type {
  MemberCourse,
  MemberEnrollment,
  MemberPayment,
  MemberSession,
} from "@/lib/member/enrollment-shared";
export {
  isAssignedSessionStarted,
  isMemberPaidEnrollment,
  isSessionStartPast,
  requiresPaidReenrollment,
} from "@/lib/member/enrollment-shared";

import type {
  MemberCourse,
  MemberEnrollment,
  MemberPayment,
  MemberSession,
} from "@/lib/member/enrollment-shared";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getMemberEnrollments(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `
      id,
      status,
      created_at,
      courses (
        id,
        title,
        slug,
        subtitle,
        description,
        course_type,
        price,
        currency,
        sort_order
      ),
      sessions (
        id,
        title,
        starts_at,
        ends_at,
        timezone,
        format,
        meeting_url,
        status
      ),
      payments (
        id,
        amount,
        currency,
        status,
        provider,
        provider_payment_id,
        created_at
      )
    `,
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getMemberEnrollments", error.message);
    return [] as MemberEnrollment[];
  }

  return (data ?? []).map((row) => {
    const course = one(row.courses as MemberCourse | MemberCourse[] | null);
    const session = one(row.sessions as MemberSession | MemberSession[] | null);
    const payments = row.payments as MemberPayment | MemberPayment[] | null;
    const paymentList = !payments
      ? []
      : Array.isArray(payments)
        ? payments
        : [payments];
    const payment =
      paymentList.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0] ?? null;

    return {
      id: row.id as string,
      status: row.status as string,
      created_at: row.created_at as string,
      course,
      session,
      payment,
    } satisfies MemberEnrollment;
  });
}

export async function getMemberPayments(studentId: string) {
  const enrollments = await getMemberEnrollments(studentId);
  return enrollments
    .filter((e) => e.payment)
    .map((e) => ({
      ...e.payment!,
      courseTitle: e.course?.title ?? "Course",
      sessionTitle: e.session?.title ?? null,
      enrollmentStatus: e.status,
      enrollmentId: e.id,
    }));
}

export function pickPrimaryEnrollment(enrollments: MemberEnrollment[]) {
  const priority = ["ACTIVE", "PENDING_PAYMENT", "COMPLETED", "CANCELLED"];
  return (
    [...enrollments].sort((a, b) => {
      const ai = priority.indexOf(a.status);
      const bi = priority.indexOf(b.status);
      if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })[0] ?? null
  );
}

export function formatSessionWhen(session: MemberSession | null) {
  if (!session?.starts_at) return "Schedule coming soon";
  return formatSessionWhenLabel(
    session.starts_at,
    session.ends_at,
    session.timezone,
  );
}

const joinLiveSessionAction = {
  title: "Join the free weekend live session",
  body: "Libre ang live session para sa tanan students. Open your Schedule for the day, time, and meeting link.",
  href: "/member/schedule",
  cta: "View live session",
};

export function enrollmentNextAction(enrollment: MemberEnrollment | null) {
  if (!enrollment || enrollment.status === "CANCELLED") {
    return joinLiveSessionAction;
  }

  if (
    enrollment.status === "PENDING_PAYMENT" &&
    enrollment.payment?.status === "PENDING"
  ) {
    return {
      title: "Pending pa ang payment",
      body: `Bayad ang ${formatPeso(Number(enrollment.payment.amount))} para ma-unlock ang course ug certificate.`,
      href: `/pay/${enrollment.payment.id}`,
      cta: "Open payment",
    };
  }

  if (enrollment.status === "ACTIVE") {
    return {
      title: "Continue your course",
      body: "Open your modules and finish each lesson para ma-unlock ang certificate. Join the weekend live session too.",
      href: "/member/modules",
      cta: "Open modules",
    };
  }

  if (enrollment.status === "COMPLETED") {
    return {
      title: "Completed na ang course",
      body: certificatesEnabled
        ? "Nice work. Open your certificate, or continue to the next Upskill Topic when ready."
        : certificatesCopy.unavailableBody,
      href: certificatesEnabled ? "/member/certificates" : "/member/modules",
      cta: certificatesEnabled ? certificatesCopy.view : "Open modules",
    };
  }

  return joinLiveSessionAction;
}

function enrollmentPayments(
  payments: MemberPayment | MemberPayment[] | null | undefined,
): MemberPayment[] {
  if (!payments) return [];
  return Array.isArray(payments) ? payments : [payments];
}

/** Staff or at least one PAID course payment (Practice Lab, Lounge, portfolio, inbox). */
export async function hasPaidCourseAccess(
  studentId: string,
  role?: UserRole | string | null,
) {
  if (isAdminRole(role)) return true;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("status, payments(status)")
    .eq("student_id", studentId)
    .neq("status", "CANCELLED")
    .limit(25);

  if (error) {
    console.error("hasPaidCourseAccess", error.message);
    return false;
  }

  return (data ?? []).some((row) =>
    enrollmentPayments(
      row.payments as MemberPayment | MemberPayment[] | null,
    ).some((payment) => payment.status === "PAID"),
  );
}

