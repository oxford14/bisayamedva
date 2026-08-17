"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { experienceLevels, referralSources } from "@/content/site";
import { deepDiveBundle } from "@/content/courses";
import {
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  AVATAR_MIME,
  avatarObjectPath,
} from "@/lib/member/avatar";
import {
  createLiveQrPhCheckout,
  retrievePaymentIntent,
} from "@/lib/paymongo/client";
import { normalizeQrSrc } from "@/lib/paymongo/qr";
import { requireStudent } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatPeso } from "@/lib/utils";

const profileSchema = z.object({
  full_name: z.string().min(2, "Please enter your full name."),
  mobile: z
    .string()
    .min(10, "Please enter a valid mobile number.")
    .regex(/^[0-9+\-\s()]+$/, "Please enter a valid mobile number.")
    .or(z.literal(""))
    .optional(),
  occupation: z.string().optional(),
  experience_level: z
    .enum(experienceLevels)
    .or(z.literal(""))
    .optional(),
  messenger_handle: z.string().optional(),
  referral_source: z.enum(referralSources).or(z.literal("")).optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Please enter your current password."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password.",
    path: ["newPassword"],
  });

export type MemberActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

type AvatarPersistResult =
  | { kind: "unchanged" }
  | { kind: "updated"; avatar_path: string | null }
  | { kind: "error"; error: string };

async function persistAvatar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  formData: FormData,
): Promise<AvatarPersistResult> {
  const removeAvatar = String(formData.get("remove_avatar") ?? "") === "1";
  const avatar = formData.get("avatar");
  const path = avatarObjectPath(userId);

  if (removeAvatar) {
    await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    return { kind: "updated", avatar_path: null };
  }

  if (
    !(typeof File !== "undefined" && avatar instanceof File) ||
    avatar.size === 0
  ) {
    return { kind: "unchanged" };
  }

  if (avatar.type !== AVATAR_MIME) {
    return {
      kind: "error",
      error: "Avatar must be a WebP image. Crop and save again.",
    };
  }

  if (avatar.size > AVATAR_MAX_BYTES) {
    return {
      kind: "error",
      error: "Avatar is too large. Keep it under 1 MB after cropping.",
    };
  }

  const buffer = Buffer.from(await avatar.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, buffer, {
      contentType: AVATAR_MIME,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    return {
      kind: "error",
      error: uploadError.message || "Could not upload your profile photo.",
    };
  }

  return { kind: "updated", avatar_path: path };
}

export async function updateMemberProfile(
  _prev: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const profile = await requireStudent();

  const parsed = profileSchema.safeParse({
    full_name: String(formData.get("full_name") ?? ""),
    mobile: String(formData.get("mobile") ?? ""),
    occupation: String(formData.get("occupation") ?? ""),
    experience_level: String(formData.get("experience_level") ?? ""),
    messenger_handle: String(formData.get("messenger_handle") ?? ""),
    referral_source: String(formData.get("referral_source") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  const supabase = await createClient();
  const avatarResult = await persistAvatar(supabase, profile.id, formData);
  if (avatarResult.kind === "error") {
    return {
      ok: false,
      message: avatarResult.error,
      fieldErrors: { avatar: avatarResult.error },
    };
  }

  const updates: Record<string, string | null> = {
    full_name: parsed.data.full_name.trim(),
    mobile: parsed.data.mobile?.trim() || null,
    occupation: parsed.data.occupation?.trim() || null,
    experience_level: parsed.data.experience_level || null,
    messenger_handle: parsed.data.messenger_handle?.trim() || null,
    referral_source: parsed.data.referral_source || null,
  };

  if (avatarResult.kind === "updated") {
    updates.avatar_path = avatarResult.avatar_path;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", profile.id);

  if (error) {
    return {
      ok: false,
      message: error.message || "Could not update your profile.",
    };
  }

  revalidatePath("/member");
  revalidatePath("/member/profile");

  return {
    ok: true,
    message: "Saved. Updated na ang imong profile.",
  };
}

export async function updateMemberPassword(
  _prev: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const profile = await requireStudent();

  const parsed = passwordSchema.safeParse({
    currentPassword: String(formData.get("current_password") ?? ""),
    newPassword: String(formData.get("new_password") ?? ""),
    confirmPassword: String(formData.get("confirm_password") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  const supabase = await createClient();

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: parsed.data.currentPassword,
  });

  if (verifyError) {
    return {
      ok: false,
      message: "Current password is incorrect.",
      fieldErrors: {
        currentPassword: "Current password is incorrect.",
      },
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (updateError) {
    return {
      ok: false,
      message: updateError.message || "Could not update your password.",
    };
  }

  revalidatePath("/member/profile");

  return {
    ok: true,
    message: "Password updated. Gamiton na ang imong new password next login.",
  };
}

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

export type MemberCheckoutActionResult =
  | { ok: true; redirectTo?: string; status?: string }
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
  revalidatePath("/member/checkout/deep-dive");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/enrollments");
}

export async function prepareDeepDivePayment(): Promise<MemberCheckoutPrepareResult> {
  try {
    const profile = await requireStudent();
    const admin = createServiceClient();

    const { data: course } = await admin
      .from("courses")
      .select("id, title, price, currency, status, slug")
      .eq("slug", deepDiveBundle.slug)
      .eq("status", "PUBLISHED")
      .maybeSingle();

    if (!course) {
      return {
        ok: false,
        error:
          "Deep Dive course is not published yet. Message the team or try again later.",
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
        error: "No published Deep Dive session yet. Message the team for the next cohort.",
      };
    }

    let { data: enrollment } = await admin
      .from("enrollments")
      .select("id, status")
      .eq("student_id", profile.id)
      .eq("course_id", course.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!enrollment) {
      const { data: created, error } = await admin
        .from("enrollments")
        .insert({
          student_id: profile.id,
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
        student_id: profile.id,
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

export async function simulateDeepDivePayment(
  paymentId: string,
): Promise<MemberCheckoutActionResult> {
  try {
    if (!paymentId) return { ok: false, error: "Missing payment id." };

    const profile = await requireStudent();
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
    if (!enrollment || enrollment.student_id !== profile.id) {
      return { ok: false, error: "This payment is not linked to your account." };
    }

    await activatePaidPayment(payment.id, payment.enrollment_id);
    return { ok: true, redirectTo: "/member/course", status: "PAID" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Simulate failed.",
    };
  }
}

export async function refreshDeepDivePaymentStatus(
  paymentId: string,
): Promise<MemberCheckoutActionResult> {
  try {
    if (!paymentId) return { ok: false, error: "Missing payment id." };

    const profile = await requireStudent();
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
    if (!enrollment || enrollment.student_id !== profile.id) {
      return { ok: false, error: "This payment is not linked to your account." };
    }

    if (payment.status === "PAID") {
      return { ok: true, redirectTo: "/member/course", status: "PAID" };
    }

    if (!payment.provider_payment_id) {
      return { ok: false, error: "No PayMongo intent yet." };
    }

    const intent = await retrievePaymentIntent(payment.provider_payment_id);
    if (intent.attributes.status === "succeeded") {
      await activatePaidPayment(payment.id, payment.enrollment_id);
      return { ok: true, redirectTo: "/member/course", status: "PAID" };
    }

    return { ok: true, status: intent.attributes.status };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Status check failed.",
    };
  }
}
