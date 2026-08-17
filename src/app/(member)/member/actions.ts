"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { experienceLevels, referralSources } from "@/content/site";
import {
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  AVATAR_MIME,
  avatarObjectPath,
} from "@/lib/member/avatar";
import { requireStudent } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

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
