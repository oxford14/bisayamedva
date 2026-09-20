import { createPortfolioSignedUrl } from "@/lib/member/portfolio/storage";
import { parsePortfolioBlocks } from "@/lib/member/portfolio/schema";
import type { PortfolioBlock, PortfolioRow } from "@/lib/member/portfolio/types";
import { createClient } from "@/lib/supabase/server";

export async function fetchOwnPortfolio(
  studentId: string,
): Promise<PortfolioRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_portfolios")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error || !data) return null;

  const parsed = parsePortfolioBlocks(data.blocks);
  if (!parsed.success) return null;

  return {
    student_id: data.student_id,
    slug: data.slug,
    is_public: data.is_public,
    template_id: data.template_id,
    theme_id: data.theme_id,
    blocks: parsed.data,
    published_at: data.published_at,
    updated_at: data.updated_at,
    created_at: data.created_at,
  } as PortfolioRow;
}

export async function buildImagePreviewUrls(
  blocks: PortfolioBlock[],
): Promise<Record<string, string>> {
  const supabase = await createClient();
  const map: Record<string, string> = {};

  for (const block of blocks) {
    if (block.type === "hero" && block.props.imagePath) {
      const url = await createPortfolioSignedUrl(
        supabase,
        block.props.imagePath,
      );
      if (url) map[`${block.id}:hero`] = url;
    }
    if (block.type === "image" && block.props.imagePath) {
      const url = await createPortfolioSignedUrl(
        supabase,
        block.props.imagePath,
      );
      if (url) map[`${block.id}:image`] = url;
    }
  }

  return map;
}

export async function isSlugTaken(slug: string, excludeStudentId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("student_portfolios")
    .select("student_id")
    .eq("slug", slug.toLowerCase())
    .limit(1);
  if (excludeStudentId) {
    query = query.neq("student_id", excludeStudentId);
  }
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

export async function allocateUniqueSlug(
  baseSlug: string,
  studentId: string,
): Promise<string> {
  let candidate = baseSlug;
  let n = 2;
  while (await isSlugTaken(candidate, studentId)) {
    const suffix = `-${n}`;
    candidate = `${baseSlug.slice(0, 48 - suffix.length)}${suffix}`;
    n += 1;
  }
  return candidate;
}
