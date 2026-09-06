"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireSuperAdmin } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/admin";

function fail(message: string) {
  return { ok: false as const, error: message };
}
function ok() {
  return { ok: true as const };
}

function failValidation(error: z.ZodError, fallback: string) {
  const issue = error.issues[0];
  if (!issue) return fail(fallback);
  const field = issue.path.join(".");
  return fail(field ? `${field}: ${issue.message}` : issue.message);
}

// Postgres accepts any 8-4-4-4-12 hex id, so avoid Zod's stricter RFC 9562 check.
const uuid = z.guid();

const courseSchema = z.object({
  id: uuid.optional(),
  slug: z.string().min(2).max(80),
  title: z.string().min(2).max(160),
  subtitle: z.string().max(240).optional().nullable(),
  course_type: z.enum(["BASIC", "UPSKILL"]),
  price: z.coerce.number().min(0),
  currency: z.string().default("PHP"),
  description: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  sort_order: z.coerce.number().int().default(0),
});

export async function upsertCourse(formData: FormData) {
  await requireAdmin();
  const parsed = courseSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle") || null,
    course_type: formData.get("course_type"),
    price: formData.get("price"),
    currency: formData.get("currency") || "PHP",
    description: formData.get("description") || null,
    status: formData.get("status"),
    sort_order: formData.get("sort_order") || 0,
  });
  if (!parsed.success) return failValidation(parsed.error, "Invalid course");

  const supabase = await createClient();
  const payload = parsed.data;
  const { error } = payload.id
    ? await supabase.from("courses").update(payload).eq("id", payload.id)
    : await supabase.from("courses").insert(payload);

  if (error) return fail(error.message);
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
  revalidatePath("/");
  return ok();
}

const optionalUrl = z.preprocess((value) => {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}, z.string().url().nullable());

const optionalUuid = z.preprocess((value) => {
  if (value == null) return undefined;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, uuid.optional());

const sessionSchema = z.object({
  id: optionalUuid,
  course_id: uuid,
  title: z.string().min(2).max(160),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  timezone: z.string().default("Asia/Manila"),
  format: z.string().default("Online"),
  capacity: z.coerce.number().int().positive(),
  meeting_url: optionalUrl,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export async function upsertSession(formData: FormData) {
  await requireAdmin();
  const parsed = sessionSchema.safeParse({
    id: formData.get("id") || undefined,
    course_id: formData.get("course_id"),
    title: formData.get("title"),
    starts_at: formData.get("starts_at"),
    ends_at: formData.get("ends_at"),
    timezone: formData.get("timezone") || "Asia/Manila",
    format: formData.get("format") || "Online",
    capacity: formData.get("capacity"),
    meeting_url: formData.get("meeting_url"),
    status: formData.get("status"),
  });
  if (!parsed.success) return failValidation(parsed.error, "Invalid session");

  const { id, ...rest } = parsed.data;
  const payload = {
    ...rest,
    meeting_url: rest.meeting_url ?? null,
  };

  const supabase = await createClient();
  // New sessions omit id so Postgres gen_random_uuid() fills it.
  const { error } = id
    ? await supabase.from("sessions").update(payload).eq("id", id)
    : await supabase.from("sessions").insert(payload);

  if (error) return fail(error.message);
  revalidatePath("/admin/sessions");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/admin/content");
  return ok();
}

export async function deleteSession(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const confirmRefund = String(formData.get("confirm_refund") ?? "") === "1";
  const parsed = uuid.safeParse(id);
  if (!parsed.success) return fail("Invalid session id.");

  const { countActiveSessionSeats, refundSessionSeatsAndArchive } =
    await import("@/lib/wallet/session-refund");

  const seatCount = await countActiveSessionSeats(parsed.data);
  if (seatCount > 0 && !confirmRefund) {
    return fail(
      `Cannot delete yet: ${seatCount} enrolled student${seatCount === 1 ? "" : "s"}. Confirm refund-to-wallet to archive this schedule.`,
    );
  }

  if (seatCount > 0) {
    const result = await refundSessionSeatsAndArchive(parsed.data);
    if (!result.ok) return fail(result.error);

    revalidatePath("/admin/sessions");
    revalidatePath("/admin");
    revalidatePath("/admin/enrollments");
    revalidatePath("/admin/payments");
    revalidatePath("/");
    revalidatePath("/member");
    revalidatePath("/member/wallet");
    revalidatePath("/member/schedule");
    revalidatePath("/member/course");
    revalidatePath("/admin/content");
    return {
      ok: true as const,
      refundedCount: result.refundedCount,
      cancelledPendingCount: result.cancelledPendingCount,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ status: "ARCHIVED" })
    .eq("id", parsed.data);

  if (error) return fail(error.message);
  revalidatePath("/admin/sessions");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/admin/content");
  return ok();
}

export async function restoreSession(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = uuid.safeParse(id);
  if (!parsed.success) return fail("Invalid session id.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ status: "DRAFT" })
    .eq("id", parsed.data)
    .eq("status", "ARCHIVED");

  if (error) return fail(error.message);

  revalidatePath("/admin/sessions");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/admin/content");
  return ok();
}

const enrollmentSchema = z.object({
  student_id: uuid,
  course_id: uuid,
  session_id: uuid,
  status: z.enum(["PENDING_PAYMENT", "ACTIVE", "CANCELLED", "COMPLETED"]).default("PENDING_PAYMENT"),
  notes: z.string().optional().nullable(),
});

export async function createEnrollment(formData: FormData) {
  await requireAdmin();
  const parsed = enrollmentSchema.safeParse({
    student_id: formData.get("student_id"),
    course_id: formData.get("course_id"),
    session_id: formData.get("session_id"),
    status: formData.get("status") || "PENDING_PAYMENT",
    notes: formData.get("notes") || null,
  });
  if (!parsed.success) return failValidation(parsed.error, "Invalid enrollment");

  const supabase = await createClient();
  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error) return fail(error.message);

  const { data: course } = await supabase
    .from("courses")
    .select("price, currency")
    .eq("id", parsed.data.course_id)
    .single();

  if (course) {
    await supabase.from("payments").insert({
      enrollment_id: enrollment.id,
      amount: course.price,
      currency: course.currency,
      status: "PENDING",
    });
  }

  revalidatePath("/admin/enrollments");
  revalidatePath("/admin/payments");
  revalidatePath("/admin");
  return ok();
}

export async function updateEnrollmentStatus(formData: FormData) {
  const profile = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const notes = String(formData.get("notes") ?? "");
  if (!id || !["PENDING_PAYMENT", "ACTIVE", "CANCELLED", "COMPLETED"].includes(status)) {
    return fail("Invalid enrollment update");
  }

  const supabase = await createClient();

  if (status === "ACTIVE" && profile.role !== "SUPER_ADMIN") {
    const { data: paid } = await supabase
      .from("payments")
      .select("id")
      .eq("enrollment_id", id)
      .eq("status", "PAID")
      .maybeSingle();
    if (!paid) {
      return fail("Activation requires a paid payment unless Super Admin overrides.");
    }
  }

  const patch: { status: string; notes?: string } = { status };
  if (notes) {
    patch.notes =
      profile.role === "SUPER_ADMIN" && status === "ACTIVE"
        ? `${notes} (override by ${profile.email})`
        : notes;
  }

  const { error } = await supabase.from("enrollments").update(patch).eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/admin/enrollments");
  revalidatePath("/admin");
  return ok();
}

export async function updatePaymentStatus(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["PENDING", "PAID", "FAILED", "REFUNDED"].includes(status)) {
    return fail("Invalid payment update");
  }
  const supabase = await createClient();
  const { error } = await supabase.from("payments").update({ status }).eq("id", id);
  if (error) return fail(error.message);

  if (status === "PAID") {
    const { data: payment } = await supabase
      .from("payments")
      .select("enrollment_id")
      .eq("id", id)
      .single();
    if (payment?.enrollment_id) {
      await supabase
        .from("enrollments")
        .update({ status: "ACTIVE" })
        .eq("id", payment.enrollment_id)
        .eq("status", "PENDING_PAYMENT");
    }
  }

  revalidatePath("/admin/payments");
  revalidatePath("/admin/enrollments");
  revalidatePath("/admin");
  return ok();
}

export async function saveContentSettings(formData: FormData) {
  await requireAdmin();
  const featured = String(formData.get("featured_course_id") ?? "").trim();
  const nextSession = String(formData.get("next_session_id") ?? "").trim();
  const supabase = await createClient();

  if (nextSession && !featured) {
    return fail("Pick a featured course first.");
  }

  if (featured) {
    const { data: course } = await supabase
      .from("courses")
      .select("id, status")
      .eq("id", featured)
      .maybeSingle();
    if (!course || course.status !== "PUBLISHED") {
      return fail("Pick a published featured course.");
    }
  }

  if (nextSession) {
    const { data: session } = await supabase
      .from("sessions")
      .select("id, status, course_id")
      .eq("id", nextSession)
      .maybeSingle();
    if (!session || session.status !== "PUBLISHED") {
      return fail("Pick a published weekend session.");
    }
    if (session.course_id !== featured) {
      return fail("That session does not belong to the featured course.");
    }
  }

  const rows = [
    { key: "featured_course_id", value: featured || null },
    { key: "next_session_id", value: nextSession || null },
  ];

  for (const row of rows) {
    const { error } = await supabase.from("site_settings").upsert({
      key: row.key,
      value: row.value,
    });
    if (error) return fail(error.message);
  }

  revalidatePath("/admin/content");
  revalidatePath("/");
  revalidatePath("/register");
  return ok();
}

export async function updateUserRole(formData: FormData) {
  await requireSuperAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId || !["SUPER_ADMIN", "ADMIN", "STUDENT"].includes(role)) {
    return fail("Invalid role update");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return fail(error.message);

  // Keep JWT app_metadata in sync for RLS helpers
  try {
    const service = createServiceClient();
    await service.auth.admin.updateUserById(userId, {
      app_metadata: { role },
    });
  } catch {
    // Profile role is source for UI; app_metadata sync best-effort
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/users");
  revalidatePath("/admin/students");
  return ok();
}

export async function updateLoungeBadge(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const raw = String(formData.get("lounge_badge") ?? "");
  const badge = raw === "" || raw === "none" ? null : raw;

  const parsed = uuid.safeParse(userId);
  if (!parsed.success) return fail("Invalid user id.");
  if (badge !== null && badge !== "COACH" && badge !== "ADMIN") {
    return fail("Invalid lounge badge.");
  }

  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({ lounge_badge: badge })
    .eq("id", parsed.data);

  if (error) return fail(error.message);

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${parsed.data}`);
  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${parsed.data}`);
  revalidatePath("/member/lounge");
  return ok();
}

const createUserSchema = z.object({
  full_name: z.string().min(2, "Enter a full name."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  mobile: z.string().optional(),
  occupation: z.string().optional(),
  experience_level: z.string().optional(),
  role: z.enum(["STUDENT", "ADMIN", "SUPER_ADMIN"]).default("STUDENT"),
});

const updateUserSchema = z.object({
  user_id: uuid,
  full_name: z.string().min(2, "Enter a full name."),
  email: z.string().email("Enter a valid email."),
  mobile: z.string().optional(),
  occupation: z.string().optional(),
  experience_level: z.string().optional(),
  messenger_handle: z.string().optional(),
  password: z.string().optional(),
});

function revalidateUserPaths(userId?: string) {
  revalidatePath("/admin/users");
  revalidatePath("/admin/students");
  revalidatePath("/admin/settings");
  if (userId) {
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath(`/admin/students/${userId}`);
  }
}

export async function createAdminUser(formData: FormData) {
  const actor = await requireAdmin();
  const parsed = createUserSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    mobile: formData.get("mobile") || undefined,
    occupation: formData.get("occupation") || undefined,
    experience_level: formData.get("experience_level") || undefined,
    role: formData.get("role") || "STUDENT",
  });
  if (!parsed.success) return failValidation(parsed.error, "Invalid user");

  if (parsed.data.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    return fail("Only a Super Admin can create Super Admin accounts.");
  }
  if (parsed.data.role === "ADMIN" && actor.role !== "SUPER_ADMIN" && actor.role !== "ADMIN") {
    return fail("Not allowed to create admin accounts.");
  }

  const service = createServiceClient();
  const { data, error } = await service.auth.admin.createUser({
    email: parsed.data.email.trim().toLowerCase(),
    password: parsed.data.password,
    email_confirm: true,
    app_metadata: { role: parsed.data.role },
    user_metadata: {
      full_name: parsed.data.full_name.trim(),
      mobile: parsed.data.mobile?.trim() || null,
      occupation: parsed.data.occupation?.trim() || null,
      experience_level: parsed.data.experience_level || null,
    },
  });

  if (error || !data.user) {
    return fail(error?.message ?? "Could not create user.");
  }

  const { error: profileError } = await service.from("profiles").upsert({
    id: data.user.id,
    email: parsed.data.email.trim().toLowerCase(),
    full_name: parsed.data.full_name.trim(),
    role: parsed.data.role,
    mobile: parsed.data.mobile?.trim() || null,
    occupation: parsed.data.occupation?.trim() || null,
    experience_level: parsed.data.experience_level || null,
  });

  if (profileError) {
    return fail(profileError.message);
  }

  revalidateUserPaths(data.user.id);
  return { ok: true as const, userId: data.user.id };
}

export async function updateAdminUser(formData: FormData) {
  await requireAdmin();
  const parsed = updateUserSchema.safeParse({
    user_id: formData.get("user_id"),
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    mobile: formData.get("mobile") || undefined,
    occupation: formData.get("occupation") || undefined,
    experience_level: formData.get("experience_level") || undefined,
    messenger_handle: formData.get("messenger_handle") || undefined,
    password: formData.get("password") || undefined,
  });
  if (!parsed.success) return failValidation(parsed.error, "Invalid user");

  const password = parsed.data.password?.trim();
  if (password && password.length < 8) {
    return fail("Password must be at least 8 characters.");
  }

  const service = createServiceClient();
  const authUpdate: {
    email: string;
    user_metadata: Record<string, string | null>;
    password?: string;
  } = {
    email: parsed.data.email.trim().toLowerCase(),
    user_metadata: {
      full_name: parsed.data.full_name.trim(),
      mobile: parsed.data.mobile?.trim() || null,
      occupation: parsed.data.occupation?.trim() || null,
      experience_level: parsed.data.experience_level || null,
      messenger_handle: parsed.data.messenger_handle?.trim() || null,
    },
  };
  if (password) authUpdate.password = password;

  const { error: authError } = await service.auth.admin.updateUserById(
    parsed.data.user_id,
    authUpdate,
  );
  if (authError) return fail(authError.message);

  const { error } = await service
    .from("profiles")
    .update({
      email: parsed.data.email.trim().toLowerCase(),
      full_name: parsed.data.full_name.trim(),
      mobile: parsed.data.mobile?.trim() || null,
      occupation: parsed.data.occupation?.trim() || null,
      experience_level: parsed.data.experience_level || null,
      messenger_handle: parsed.data.messenger_handle?.trim() || null,
    })
    .eq("id", parsed.data.user_id);

  if (error) return fail(error.message);

  revalidateUserPaths(parsed.data.user_id);
  return ok();
}

export async function promoteUserToAdmin(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const parsed = uuid.safeParse(userId);
  if (!parsed.success) return fail("Invalid user id.");

  const service = createServiceClient();
  const { data: target } = await service
    .from("profiles")
    .select("id, role")
    .eq("id", parsed.data)
    .maybeSingle();

  if (!target) return fail("User not found.");
  if (target.role !== "STUDENT") {
    return fail("Only students can be promoted to Admin from here.");
  }

  const { error } = await service
    .from("profiles")
    .update({ role: "ADMIN" })
    .eq("id", parsed.data);
  if (error) return fail(error.message);

  try {
    await service.auth.admin.updateUserById(parsed.data, {
      app_metadata: { role: "ADMIN" },
    });
  } catch {
    // best-effort JWT sync
  }

  revalidateUserPaths(parsed.data);
  return ok();
}

export async function deleteAdminUser(formData: FormData) {
  const actor = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const parsed = uuid.safeParse(userId);
  if (!parsed.success) return fail("Invalid user id.");

  if (parsed.data === actor.id) {
    return fail("You cannot delete your own account.");
  }

  const service = createServiceClient();
  const { data: target } = await service
    .from("profiles")
    .select("id, role")
    .eq("id", parsed.data)
    .maybeSingle();

  if (!target) return fail("User not found.");

  if (
    (target.role === "ADMIN" || target.role === "SUPER_ADMIN") &&
    actor.role !== "SUPER_ADMIN"
  ) {
    return fail("Only a Super Admin can delete admin accounts.");
  }

  const { error } = await service.auth.admin.deleteUser(parsed.data);
  if (error) return fail(error.message);

  revalidateUserPaths();
  return ok();
}

const promoSchema = z.object({
  id: optionalUuid,
  code: z
    .string()
    .min(2)
    .max(40)
    .transform((v) => v.trim().toUpperCase().replace(/\s+/g, "")),
  discount_type: z.enum(["FIXED", "PERCENT"]),
  discount_value: z.coerce.number().positive(),
  unlimited: z.preprocess((v) => v === "1" || v === "on" || v === true, z.boolean()),
  max_redemptions: z.coerce.number().int().positive().optional(),
  active: z.preprocess((v) => v === "1" || v === "on" || v === true, z.boolean()),
  ends_at: z.string().optional(),
  note: z.string().optional(),
});

export async function upsertPromoCode(formData: FormData) {
  await requireAdmin();
  const parsed = promoSchema.safeParse({
    id: formData.get("id") || undefined,
    code: formData.get("code"),
    discount_type: formData.get("discount_type"),
    discount_value: formData.get("discount_value"),
    unlimited: formData.get("unlimited"),
    max_redemptions: formData.get("max_redemptions") || undefined,
    active: formData.get("active"),
    ends_at: formData.get("ends_at") || undefined,
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return failValidation(parsed.error, "Invalid promo");

  if (
    parsed.data.discount_type === "PERCENT" &&
    parsed.data.discount_value > 100
  ) {
    return fail("Percent discount must be 100 or less.");
  }

  const maxRedemptions = parsed.data.unlimited
    ? null
    : parsed.data.max_redemptions ?? null;
  if (!parsed.data.unlimited && !maxRedemptions) {
    return fail("Enter max slots, or mark as unlimited.");
  }

  let endsAt: string | null = null;
  if (parsed.data.ends_at?.trim()) {
    const d = new Date(parsed.data.ends_at);
    if (Number.isNaN(d.getTime())) return fail("Invalid end date.");
    endsAt = d.toISOString();
  }

  const payload = {
    code: parsed.data.code,
    discount_type: parsed.data.discount_type,
    discount_value: parsed.data.discount_value,
    max_redemptions: maxRedemptions,
    active: parsed.data.active,
    ends_at: endsAt,
    note: parsed.data.note?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const { error } = parsed.data.id
    ? await supabase.from("promo_codes").update(payload).eq("id", parsed.data.id)
    : await supabase.from("promo_codes").insert(payload);

  if (error) return fail(error.message);
  revalidatePath("/admin/promos");
  return ok();
}

export async function togglePromoActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "1";
  const parsed = uuid.safeParse(id);
  if (!parsed.success) return fail("Invalid promo id.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("promo_codes")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", parsed.data);

  if (error) return fail(error.message);
  revalidatePath("/admin/promos");
  return ok();
}

export async function saveReferralCommissions(formData: FormData) {
  await requireSuperAdmin();
  const courseIds = formData
    .getAll("course_ids")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (courseIds.length === 0) {
    return fail("No courses to save.");
  }

  const rows: {
    course_id: string;
    mode: "FIXED" | "PERCENT";
    value: number;
    enabled: boolean;
    updated_at: string;
  }[] = [];

  for (const courseId of courseIds) {
    const parsedId = uuid.safeParse(courseId);
    if (!parsedId.success) return fail("Invalid course id.");
    const modeRaw = String(formData.get(`mode_${courseId}`) ?? "FIXED");
    const mode = modeRaw === "PERCENT" ? "PERCENT" : "FIXED";
    const value = Number(formData.get(`value_${courseId}`) ?? 0);
    if (!Number.isFinite(value) || value < 0) {
      return fail("Commission value must be 0 or more.");
    }
    if (mode === "PERCENT" && value > 100) {
      return fail("Percent commission cannot exceed 100.");
    }
    rows.push({
      course_id: parsedId.data,
      mode,
      value,
      enabled: String(formData.get(`enabled_${courseId}`) ?? "") === "on",
      updated_at: new Date().toISOString(),
    });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("course_referral_commissions")
    .upsert(rows, { onConflict: "course_id" });
  if (error) return fail(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/member/refer");
  return ok();
}

export async function reviewWalletWithdrawal(formData: FormData) {
  const profile = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reviewNote = String(formData.get("review_note") ?? "");

  if (!id || !["APPROVED", "REJECTED"].includes(decision)) {
    return fail("Invalid withdrawal review.");
  }

  const { reviewWithdrawal } = await import("@/lib/wallet/withdraw");
  const result = await reviewWithdrawal({
    adminId: profile.id,
    withdrawalId: id,
    decision: decision as "APPROVED" | "REJECTED",
    reviewNote,
  });
  if (!result.ok) return fail(result.error);

  revalidatePath("/admin/withdrawals");
  revalidatePath("/admin");
  revalidatePath("/member/wallet");
  return ok();
}
