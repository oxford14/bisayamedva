import { createServiceClient } from "@/lib/supabase/admin";
import { applyReferredBy, resolveReferralCode } from "@/lib/referrals/codes";
import type { RegistrationIntentPayload } from "@/lib/register/intent-crypto";

function escapeIlikePattern(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function findProfileIdByEmail(email: string) {
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

/**
 * Creates Supabase Auth user + profiles row from registration draft fields.
 * Does not sign the user in.
 */
export async function createStudentFromRegistrationPayload(
  draft: RegistrationIntentPayload,
): Promise<string> {
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
    throw new Error("REGISTRATION_EMAIL_EXISTS");
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
      throw new Error("REGISTRATION_EMAIL_EXISTS");
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

  return userId;
}
