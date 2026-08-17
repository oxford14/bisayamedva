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
  const featured = String(formData.get("featured_course_id") ?? "");
  const nextSession = String(formData.get("next_session_id") ?? "");
  const supabase = await createClient();

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
  revalidatePath("/admin/students");
  return ok();
}
