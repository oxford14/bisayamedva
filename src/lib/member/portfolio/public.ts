import { createAvatarSignedUrl } from "@/lib/member/avatar";
import { createPortfolioSignedUrl } from "@/lib/member/portfolio/storage";
import { parsePortfolioBlocks } from "@/lib/member/portfolio/schema";
import type {
  PortfolioBlock,
  PortfolioThemeId,
  PublicPortfolio,
} from "@/lib/member/portfolio/types";
import { createServiceClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function hydratePortfolioImageUrls(
  blocks: PortfolioBlock[],
): Promise<PortfolioBlock[]> {
  const admin = createServiceClient();
  const out: PortfolioBlock[] = [];

  for (const block of blocks) {
    if (block.type === "hero") {
      const url = await createPortfolioSignedUrl(
        admin,
        block.props.imagePath,
      );
      out.push({
        ...block,
        props: {
          ...block.props,
          imagePath: url,
        },
      });
      continue;
    }
    if (block.type === "image") {
      const url = await createPortfolioSignedUrl(
        admin,
        block.props.imagePath,
      );
      out.push({
        ...block,
        props: {
          ...block.props,
          imagePath: url,
        },
      });
      continue;
    }
    out.push(block);
  }

  return out;
}

/** Signed URLs in hero/image blocks (display only). */
export type HydratedPortfolioBlock = PortfolioBlock;

export async function getPublicPortfolioSlugForStudent(
  admin: SupabaseClient,
  studentId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from("student_portfolios")
    .select("slug")
    .eq("student_id", studentId)
    .eq("is_public", true)
    .maybeSingle();

  if (error || !data?.slug) return null;
  return data.slug as string;
}

export async function getPublicPortfolioBySlug(
  slug: string,
): Promise<PublicPortfolio | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const admin = createServiceClient();
  const { data, error } = await admin
    .from("student_portfolios")
    .select(
      "slug, theme_id, blocks, is_public, profiles(full_name, avatar_path)",
    )
    .eq("slug", normalized)
    .eq("is_public", true)
    .maybeSingle();

  if (error || !data) return null;

  const profile = one(
    data.profiles as
      | { full_name: string; avatar_path: string | null }
      | { full_name: string; avatar_path: string | null }[]
      | null,
  );

  const parsed = parsePortfolioBlocks(data.blocks);
  if (!parsed.success) return null;

  const hydrated = await hydratePortfolioImageUrls(parsed.data);
  const avatarUrl = profile?.avatar_path
    ? await createAvatarSignedUrl(admin, profile.avatar_path)
    : null;

  return {
    slug: data.slug as string,
    themeId: data.theme_id as PortfolioThemeId,
    blocks: hydrated,
    studentName: profile?.full_name ?? "Student",
    avatarUrl,
  };
}

export async function getPortfolioBySlugForOwner(
  slug: string,
  studentId: string,
): Promise<PublicPortfolio | null> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("student_portfolios")
    .select("slug, theme_id, blocks, student_id, profiles(full_name, avatar_path)")
    .eq("slug", slug.trim().toLowerCase())
    .eq("student_id", studentId)
    .maybeSingle();

  if (error || !data) return null;

  const profile = one(
    data.profiles as
      | { full_name: string; avatar_path: string | null }
      | { full_name: string; avatar_path: string | null }[]
      | null,
  );

  const parsed = parsePortfolioBlocks(data.blocks);
  if (!parsed.success) return null;

  const hydrated = await hydratePortfolioImageUrls(parsed.data);
  const avatarUrl = profile?.avatar_path
    ? await createAvatarSignedUrl(admin, profile.avatar_path)
    : null;

  return {
    slug: data.slug as string,
    themeId: data.theme_id as PortfolioThemeId,
    blocks: hydrated,
    studentName: profile?.full_name ?? "Student",
    avatarUrl,
  };
}
