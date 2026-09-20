import type { SupabaseClient } from "@supabase/supabase-js";

export const PORTFOLIO_IMAGE_BUCKET = "portfolio-assets";
export const PORTFOLIO_IMAGE_MAX_BYTES = 3_145_728;
export const PORTFOLIO_IMAGE_MIME = [
  "image/webp",
  "image/jpeg",
  "image/png",
] as const;
export const PORTFOLIO_SIGNED_URL_TTL_SECONDS = 60 * 60;

export function portfolioImageObjectPath(
  userId: string,
  blockId: string,
  ext: "webp" | "jpg" | "png",
) {
  const id = crypto.randomUUID();
  return `${userId}/${blockId}/${id}.${ext}`;
}

export function extFromPortfolioMime(
  mime: string,
): "webp" | "jpg" | "png" | null {
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return null;
}

export async function createPortfolioSignedUrl(
  supabase: SupabaseClient,
  path: string | null | undefined,
) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(PORTFOLIO_IMAGE_BUCKET)
    .createSignedUrl(path, PORTFOLIO_SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
