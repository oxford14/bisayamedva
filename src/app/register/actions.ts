"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { experienceLevels, referralSources } from "@/content/site";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  createLiveQrPhCheckout,
  retrievePaymentIntent,
} from "@/lib/paymongo/client";
import { normalizeQrSrc } from "@/lib/paymongo/qr";
import { formatPeso } from "@/lib/utils";

const draftSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().min(10),
  password: z.string().min(8),
  occupation: z.string().optional(),
  experienceLevel: z.enum(experienceLevels).optional(),
  messengerName: z.string().optional(),
  referralSource: z.enum(referralSources).optional(),
  sessionId: z.string().min(1),
});

export type CheckoutPrepareResult =
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

export type CheckoutActionResult =
  | { ok: true; redirectTo?: string; status?: string }
  | { ok: false; error: string };

async function resolveOfferIds(preferredSessionId: string) {
  const admin = createServiceClient();

  const { data: settings } = await admin
    .from("site_settings")
    .select("key, value");
  const map = Object.fromEntries(
    (settings ?? []).map((row) => [row.key, row.value]),
  );

  function unwrap(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value === "string") return value.replace(/^"|"$/g, "");
    return String(value);
  }

  let courseId = unwrap(map.featured_course_id);
  let sessionId = unwrap(map.next_session_id);

  if (
    preferredSessionId &&
    /^[0-9a-f-]{36}$/i.test(preferredSessionId)
  ) {
    sessionId = preferredSessionId;
  }

  let course =
    courseId
      ? (
          await admin
            .from("courses")
            .select("id, title, price, currency, status")
            .eq("id", courseId)
            .maybeSingle()
        ).data
      : null;

  if (!course) {
    const { data: fallbackCourse } = await admin
      .from("courses")
      .select("id, title, price, currency, status")
      .eq("status", "PUBLISHED")
      .eq("course_type", "BASIC")
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    course = fallbackCourse;
    courseId = fallbackCourse?.id ?? null;
  }

  let session =
    sessionId
      ? (
          await admin
            .from("sessions")
            .select(
              "id, title, starts_at, ends_at, timezone, format, status, course_id",
            )
            .eq("id", sessionId)
            .maybeSingle()
        ).data
      : null;

  if (!session && courseId) {
    const { data: fallbackSession } = await admin
      .from("sessions")
      .select(
        "id, title, starts_at, ends_at, timezone, format, status, course_id",
      )
      .eq("course_id", courseId)
      .eq("status", "PUBLISHED")
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    session = fallbackSession;
  }

  if (!course || !session) {
    throw new Error(
      "No published course/session found. Set featured course and next session in Admin Content first.",
    );
  }

  return { course, session };
}

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

async function ensureStudentUser(draft: z.infer<typeof draftSchema>) {
  const admin = createServiceClient();
  const fullName = `${draft.firstName} ${draft.lastName}`.trim();
  const metadata = {
    full_name: fullName,
    first_name: draft.firstName,
    last_name: draft.lastName,
    mobile: draft.mobile,
    occupation: draft.occupation ?? null,
    experience_level: draft.experienceLevel ?? null,
    messenger_handle: draft.messengerName ?? null,
    referral_source: draft.referralSource ?? null,
  };

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", draft.email)
    .maybeSingle();

  let userId = existingProfile?.id as string | undefined;

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: draft.email,
      password: draft.password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error || !data.user) {
      throw new Error(error?.message ?? "Could not create your account.");
    }
    userId = data.user.id;
  } else {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: draft.password,
      user_metadata: metadata,
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  await admin.from("profiles").upsert({
    id: userId,
    email: draft.email,
    full_name: fullName,
    role: "STUDENT",
    mobile: draft.mobile,
    occupation: draft.occupation ?? null,
    experience_level: draft.experienceLevel ?? null,
    messenger_handle: draft.messengerName ?? null,
    referral_source: draft.referralSource ?? null,
  });

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: draft.email,
    password: draft.password,
  });
  if (signInError) {
    throw new Error(
      signInError.message ||
        "Account ready, but automatic login failed. Please log in manually.",
    );
  }

  return userId;
}

async function activatePaidPayment(paymentId: string, enrollmentId: string) {
  const admin = createServiceClient();
  const { error: payError } = await admin
    .from("payments")
    .update({ status: "PAID" })
    .eq("id", paymentId);
  if (payError) throw new Error(payError.message);

  const { error: enrollError } = await admin
    .from("enrollments")
    .update({ status: "ACTIVE" })
    .eq("id", enrollmentId);
  if (enrollError) throw new Error(enrollError.message);

  revalidatePath("/member");
  revalidatePath("/member/payments");
  revalidatePath("/member/course");
  revalidatePath("/member/schedule");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/enrollments");
}

export async function prepareCheckoutPayment(
  draftInput: unknown,
): Promise<CheckoutPrepareResult> {
  try {
    const parsed = draftSchema.safeParse(draftInput);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Missing registration details. Balik sa register page.",
      };
    }

    const draft = parsed.data;
    const { course, session } = await resolveOfferIds(draft.sessionId);
    const userId = await ensureStudentUser(draft);
    const admin = createServiceClient();

    let { data: enrollment } = await admin
      .from("enrollments")
      .select("id, status")
      .eq("student_id", userId)
      .eq("course_id", course.id)
      .eq("session_id", session.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!enrollment) {
      const { data: created, error } = await admin
        .from("enrollments")
        .insert({
          student_id: userId,
          course_id: course.id,
          session_id: session.id,
          status: "PENDING_PAYMENT",
        })
        .select("id, status")
        .single();
      if (error || !created) {
        return { ok: false, error: error?.message ?? "Could not create enrollment." };
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
        return { ok: false, error: error?.message ?? "Could not create payment." };
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
          await activatePaidPayment(payment.id, enrollment.id);
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
        student_id: userId,
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

export async function simulateCheckoutPayment(
  paymentId: string,
): Promise<CheckoutActionResult> {
  try {
    if (!paymentId) return { ok: false, error: "Missing payment id." };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Please log in first." };

    const admin = createServiceClient();
    const { data: payment } = await admin
      .from("payments")
      .select("id, status, enrollment_id, enrollments(student_id, status)")
      .eq("id", paymentId)
      .maybeSingle();

    if (!payment) return { ok: false, error: "Payment not found." };

    const enrollment = Array.isArray(payment.enrollments)
      ? payment.enrollments[0]
      : payment.enrollments;
    if (!enrollment || enrollment.student_id !== user.id) {
      return { ok: false, error: "This payment is not linked to your account." };
    }

    await activatePaidPayment(payment.id, payment.enrollment_id);
    return { ok: true, redirectTo: "/member", status: "PAID" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Simulate failed.",
    };
  }
}

export async function refreshCheckoutPaymentStatus(
  paymentId: string,
): Promise<CheckoutActionResult> {
  try {
    if (!paymentId) return { ok: false, error: "Missing payment id." };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Please log in first." };

    const admin = createServiceClient();
    const { data: payment } = await admin
      .from("payments")
      .select(
        "id, status, provider_payment_id, enrollment_id, enrollments(student_id)",
      )
      .eq("id", paymentId)
      .maybeSingle();

    if (!payment) return { ok: false, error: "Payment not found." };

    const enrollment = Array.isArray(payment.enrollments)
      ? payment.enrollments[0]
      : payment.enrollments;
    if (!enrollment || enrollment.student_id !== user.id) {
      return { ok: false, error: "This payment is not linked to your account." };
    }

    if (payment.status === "PAID") {
      return { ok: true, redirectTo: "/member", status: "PAID" };
    }

    if (!payment.provider_payment_id) {
      return { ok: false, error: "No PayMongo intent yet." };
    }

    const intent = await retrievePaymentIntent(payment.provider_payment_id);
    if (intent.attributes.status === "succeeded") {
      await activatePaidPayment(payment.id, payment.enrollment_id);
      return { ok: true, redirectTo: "/member", status: "PAID" };
    }

    return { ok: true, status: intent.attributes.status };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Status check failed.",
    };
  }
}
