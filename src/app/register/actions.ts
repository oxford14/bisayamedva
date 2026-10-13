"use server";

import { z } from "zod";
import { authCopy, experienceLevels, referralSources } from "@/content/site";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { applyReferredBy, resolveReferralCode } from "@/lib/referrals/codes";

const draftSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  mobile: z.string().min(10),
  password: z.string().min(8),
  occupation: z.string().optional(),
  experienceLevel: z.enum(experienceLevels).optional(),
  messengerName: z.string().optional(),
  referralSource: z.enum(referralSources).optional(),
  refCode: z.string().optional(),
});

export type RegisterFreeAccountResult =
  | { ok: true }
  | { ok: false; error: string; code?: "EMAIL_TAKEN" };

export type CheckRegisterEmailResult =
  | { ok: true }
  | { ok: false; error: string; code: "EMAIL_TAKEN" | "INVALID_EMAIL" };

class RegisterEmailTakenError extends Error {
  readonly code = "EMAIL_TAKEN" as const;

  constructor() {
    super(authCopy.register.emailTaken);
    this.name = "RegisterEmailTakenError";
  }
}

function escapeIlikePattern(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

async function findProfileIdByEmail(email: string) {
  const admin = createServiceClient();
  const normalized = email.trim().toLowerCase();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", escapeIlikePattern(normalized))
    .limit(1)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export async function checkRegisterEmail(
  email: string,
): Promise<CheckRegisterEmailResult> {
  const parsed = z.string().email().safeParse(email.trim());
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please enter a valid email address.",
      code: "INVALID_EMAIL",
    };
  }

  const existingId = await findProfileIdByEmail(parsed.data);
  if (existingId) {
    return {
      ok: false,
      error: authCopy.register.emailTaken,
      code: "EMAIL_TAKEN",
    };
  }

  return { ok: true };
}

async function ensureStudentUser(draft: z.infer<typeof draftSchema>) {
  const admin = createServiceClient();
  const email = draft.email.trim().toLowerCase();
  const fullName = `${draft.firstName} ${draft.lastName}`.trim();
  const referrer = await resolveReferralCode(draft.refCode);
  const referralSource = referrer
    ? draft.referralSource || "Referral"
    : draft.referralSource ?? null;
  const metadata = {
    full_name: fullName,
    first_name: draft.firstName,
    last_name: draft.lastName,
    mobile: draft.mobile,
    occupation: draft.occupation ?? null,
    experience_level: draft.experienceLevel ?? null,
    messenger_handle: draft.messengerName ?? null,
    referral_source: referralSource,
  };

  const existingId = await findProfileIdByEmail(email);
  if (existingId) {
    throw new RegisterEmailTakenError();
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: draft.password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error || !data.user) {
    const message = error?.message ?? "Could not create your account.";
    if (/already/i.test(message)) {
      throw new RegisterEmailTakenError();
    }
    throw new Error(message);
  }

  const userId = data.user.id;

  await admin.from("profiles").upsert({
    id: userId,
    email,
    full_name: fullName,
    role: "STUDENT",
    mobile: draft.mobile,
    occupation: draft.occupation ?? null,
    experience_level: draft.experienceLevel ?? null,
    messenger_handle: draft.messengerName ?? null,
    referral_source: referralSource,
  });

  if (referrer) {
    await applyReferredBy(userId, draft.refCode);
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
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

/** Free signup: account + profile only. Course payment happens later in My Courses. */
export async function registerFreeAccount(
  draftInput: unknown,
): Promise<RegisterFreeAccountResult> {
  const parsed = draftSchema.safeParse(draftInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Missing registration details. Balik sa register page.",
    };
  }

  try {
    await ensureStudentUser(parsed.data);
    return { ok: true };
  } catch (error) {
    if (error instanceof RegisterEmailTakenError) {
      return { ok: false, error: error.message, code: "EMAIL_TAKEN" };
    }
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not create your account.",
    };
  }
}
