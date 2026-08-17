import type { SupabaseClient } from "@supabase/supabase-js";

export const AVATAR_BUCKET = "profile-avatars";
export const AVATAR_FILE_NAME = "avatar.webp";
export const AVATAR_MIME = "image/webp";
export const AVATAR_MAX_BYTES = 1_048_576;
export const AVATAR_OUTPUT_SIZE = 640;
export const AVATAR_QUALITY = 0.88;
export const AVATAR_SIGNED_URL_TTL_SECONDS = 60 * 60;

export function avatarObjectPath(userId: string) {
  return `${userId}/${AVATAR_FILE_NAME}`;
}

export async function createAvatarSignedUrl(
  supabase: SupabaseClient,
  avatarPath: string | null | undefined,
) {
  if (!avatarPath) return null;

  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(avatarPath, AVATAR_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
