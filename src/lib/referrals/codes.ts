import { createServiceClient } from "@/lib/supabase/admin";

export function normalizeReferralCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function slugFromName(name: string) {
  const letters = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return letters.slice(0, 6) || "BMVA";
}

function randomSuffix() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function generateUniqueReferralCode(fullName: string) {
  const admin = createServiceClient();
  const prefix = slugFromName(fullName);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = `${prefix}${randomSuffix()}`;
    const [{ data: taken }, { data: promo }] = await Promise.all([
      admin.from("profiles").select("id").eq("referral_code", code).maybeSingle(),
      admin.from("promo_codes").select("id").eq("code", code).maybeSingle(),
    ]);
    if (!taken && !promo) return code;
  }

  return `BMVA${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export async function ensureReferralCode(
  profileId: string,
  fullName: string,
): Promise<string> {
  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("referral_code")
    .eq("id", profileId)
    .maybeSingle();

  if (existing?.referral_code) return existing.referral_code as string;

  const code = await generateUniqueReferralCode(fullName);
  const { error } = await admin
    .from("profiles")
    .update({ referral_code: code })
    .eq("id", profileId)
    .is("referral_code", null);

  if (error) {
    const { data: retry } = await admin
      .from("profiles")
      .select("referral_code")
      .eq("id", profileId)
      .maybeSingle();
    if (retry?.referral_code) return retry.referral_code as string;
    throw new Error(error.message);
  }

  const { data: saved } = await admin
    .from("profiles")
    .select("referral_code")
    .eq("id", profileId)
    .maybeSingle();

  return (saved?.referral_code as string) ?? code;
}

export async function resolveReferralCode(codeInput: string | null | undefined) {
  const code = codeInput ? normalizeReferralCode(codeInput) : "";
  if (!code) return null;

  const admin = createServiceClient();
  const { data } = await admin
    .from("profiles")
    .select("id, referral_code")
    .eq("referral_code", code)
    .maybeSingle();

  if (!data?.id) return null;
  return { id: data.id as string, code: data.referral_code as string };
}

export async function applyReferredBy(
  studentId: string,
  codeInput: string | null | undefined,
) {
  const referrer = await resolveReferralCode(codeInput);
  if (!referrer || referrer.id === studentId) return null;

  const admin = createServiceClient();
  const { data: current } = await admin
    .from("profiles")
    .select("referred_by")
    .eq("id", studentId)
    .maybeSingle();

  if (current?.referred_by) return current.referred_by as string;

  const { error } = await admin
    .from("profiles")
    .update({ referred_by: referrer.id })
    .eq("id", studentId)
    .is("referred_by", null);

  if (error) {
    console.error("applyReferredBy", error.message);
    return null;
  }

  return referrer.id;
}
