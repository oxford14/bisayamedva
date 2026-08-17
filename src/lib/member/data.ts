import { createClient } from "@/lib/supabase/server";
import { formatPeso } from "@/lib/utils";

export type MemberCourse = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  course_type: string | null;
  price: number | null;
  currency: string | null;
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
        subtitle,
        description,
        course_type,
        price,
        currency
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
  const start = new Date(session.starts_at);
  const end = session.ends_at ? new Date(session.ends_at) : null;
  const date = start.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const startTime = start.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTime = end
    ? end.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })
    : null;
  const tz = session.timezone ? ` · ${session.timezone}` : "";
  return endTime
    ? `${date} · ${startTime} – ${endTime}${tz}`
    : `${date} · ${startTime}${tz}`;
}

export function enrollmentNextAction(enrollment: MemberEnrollment | null) {
  if (!enrollment) {
    return {
      title: "Wala pa kay enrollment",
      body: "Register for Medical Billing training para maka-start. Admin can also enroll you once your account is ready.",
      href: "/register",
      cta: "Go to register",
    };
  }

  if (enrollment.status === "PENDING_PAYMENT" || enrollment.payment?.status === "PENDING") {
    const payHref = enrollment.payment
      ? `/pay/${enrollment.payment.id}`
      : "/member/payments";
    return {
      title: "Pending pa ang payment",
      body: enrollment.payment
        ? `Bayad ang ${formatPeso(Number(enrollment.payment.amount))} para ma-activate ang imong seat.`
        : "Complete your payment para ma-activate ang imong training seat.",
      href: payHref,
      cta: "Open payment",
    };
  }

  if (enrollment.status === "ACTIVE") {
    return {
      title: "Ready na imong training",
      body: "Check your schedule and join the weekend session when it starts.",
      href: "/member/schedule",
      cta: "View schedule",
    };
  }

  if (enrollment.status === "COMPLETED") {
    return {
      title: "Completed na ang course",
      body: "Nice work. Review your course details anytime, or ask about next steps for Upskill Topics.",
      href: "/member/course",
      cta: "View course",
    };
  }

  return {
    title: "Enrollment cancelled",
    body: "Kung gusto ka mag-enroll balik, register again or message the team.",
    href: "/register",
    cta: "Register again",
  };
}

export function canShowMeetingUrl(enrollment: MemberEnrollment) {
  return (
    enrollment.status === "ACTIVE" &&
    Boolean(enrollment.session?.meeting_url) &&
    (!enrollment.session?.status || enrollment.session.status === "PUBLISHED")
  );
}
