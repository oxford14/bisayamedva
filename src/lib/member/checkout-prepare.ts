import { getCatalogCourseBySlug } from "@/content/courses";
import { activatePaidEnrollment } from "@/lib/paymongo/activate";
import {
  createLiveQrPhCheckout,
  retrievePaymentIntent,
} from "@/lib/paymongo/client";
import { normalizeQrSrc } from "@/lib/paymongo/qr";
import { createServiceClient } from "@/lib/supabase/admin";
import { formatPeso } from "@/lib/utils";

export type MemberCheckoutPrepareResult =
  | {
      ok: true;
      paymentId: string;
      enrollmentId: string;
      qrImageUrl: string;
      amountLabel: string;
      courseTitle: string;
      sessionLabel: string;
      providerPaymentId: string;
      alreadyPaid: boolean;
    }
  | { ok: false; error: string };

function sessionLabel(session: {
  title: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
}) {
  const start = new Date(session.starts_at);
  const end = new Date(session.ends_at);
  const day = new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    timeZone: session.timezone,
  }).format(start);
  const startTime = new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: session.timezone,
  }).format(start);
  const endTime = new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: session.timezone,
  }).format(end);
  const tz = session.timezone === "Asia/Manila" ? "PHT" : session.timezone;
  return `${day} · ${startTime}–${endTime} ${tz}`;
}

export async function prepareCoursePaymentForStudent(
  slug: string,
  studentId: string,
): Promise<MemberCheckoutPrepareResult> {
  try {
    const catalogCourse = getCatalogCourseBySlug(slug);
    if (!catalogCourse || catalogCourse.registerPath) {
      return { ok: false, error: "Invalid course for member checkout." };
    }

    const admin = createServiceClient();

    const { data: course } = await admin
      .from("courses")
      .select("id, title, price, currency, status, slug")
      .eq("slug", slug)
      .eq("status", "PUBLISHED")
      .maybeSingle();

    if (!course) {
      return {
        ok: false,
        error:
          "This course is not published yet. Message the team or try again later.",
      };
    }

    const { data: session } = await admin
      .from("sessions")
      .select(
        "id, title, starts_at, ends_at, timezone, format, status, course_id",
      )
      .eq("course_id", course.id)
      .eq("status", "PUBLISHED")
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!session) {
      return {
        ok: false,
        error:
          "No published session yet for this course. Message the team for the next cohort.",
      };
    }

    let { data: enrollment } = await admin
      .from("enrollments")
      .select("id, status")
      .eq("student_id", studentId)
      .eq("course_id", course.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!enrollment) {
      const { data: created, error } = await admin
        .from("enrollments")
        .insert({
          student_id: studentId,
          course_id: course.id,
          session_id: session.id,
          status: "PENDING_PAYMENT",
        })
        .select("id, status")
        .single();
      if (error || !created) {
        return {
          ok: false,
          error: error?.message ?? "Could not create enrollment.",
        };
      }
      enrollment = created;
    }

    let { data: payment } = await admin
      .from("payments")
      .select("id, amount, currency, status, provider_payment_id")
      .eq("enrollment_id", enrollment.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment) {
      const { data: createdPayment, error } = await admin
        .from("payments")
        .insert({
          enrollment_id: enrollment.id,
          amount: course.price,
          currency: course.currency || "PHP",
          status: "PENDING",
          provider: "PAYMONGO",
        })
        .select("id, amount, currency, status, provider_payment_id")
        .single();
      if (error || !createdPayment) {
        return {
          ok: false,
          error: error?.message ?? "Could not create payment.",
        };
      }
      payment = createdPayment;
    }

    if (payment.status === "PAID" || enrollment.status === "ACTIVE") {
      return {
        ok: true,
        paymentId: payment.id,
        enrollmentId: enrollment.id,
        qrImageUrl: "",
        amountLabel: formatPeso(Number(payment.amount)),
        courseTitle: course.title,
        sessionLabel: sessionLabel(session),
        providerPaymentId: payment.provider_payment_id ?? "",
        alreadyPaid: true,
      };
    }

    let qrImageUrl = "";
    let providerPaymentId = payment.provider_payment_id ?? "";

    if (providerPaymentId) {
      try {
        const intent = await retrievePaymentIntent(providerPaymentId);
        if (intent.attributes.status === "succeeded") {
          await activatePaidEnrollment({ paymentId: payment.id });
          return {
            ok: true,
            paymentId: payment.id,
            enrollmentId: enrollment.id,
            qrImageUrl: "",
            amountLabel: formatPeso(Number(payment.amount)),
            courseTitle: course.title,
            sessionLabel: sessionLabel(session),
            providerPaymentId,
            alreadyPaid: true,
          };
        }
      } catch {
        // Fall through and create a fresh QR checkout.
      }
    }

    const live = await createLiveQrPhCheckout({
      amountPesos: Number(payment.amount),
      description: `${course.title} · Bisaya MedVA`,
      metadata: {
        payment_id: payment.id,
        enrollment_id: enrollment.id,
        student_id: studentId,
      },
    });

    providerPaymentId = live.paymentIntentId;
    qrImageUrl = normalizeQrSrc(live.qrImageUrl);

    await admin
      .from("payments")
      .update({
        provider: "PAYMONGO",
        provider_payment_id: providerPaymentId,
        status: "PENDING",
      })
      .eq("id", payment.id);

    return {
      ok: true,
      paymentId: payment.id,
      enrollmentId: enrollment.id,
      qrImageUrl,
      amountLabel: formatPeso(Number(payment.amount)),
      courseTitle: course.title,
      sessionLabel: sessionLabel(session),
      providerPaymentId,
      alreadyPaid: false,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Checkout failed.",
    };
  }
}
