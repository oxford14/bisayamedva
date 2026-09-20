"use server";

import { revalidatePath } from "next/cache";
import {
  allocateUniqueSlug,
  fetchOwnPortfolio,
  isSlugTaken,
} from "@/lib/member/portfolio/data";
import { requirePortfolioStudent } from "@/lib/member/portfolio/access";
import {
  extFromPortfolioMime,
  PORTFOLIO_IMAGE_BUCKET,
  PORTFOLIO_IMAGE_MAX_BYTES,
  PORTFOLIO_IMAGE_MIME,
  portfolioImageObjectPath,
} from "@/lib/member/portfolio/storage";
import {
  portfolioDraftSchema,
  portfolioTemplateSchema,
} from "@/lib/member/portfolio/schema";
import {
  normalizePortfolioSlug,
  suggestSlugFromName,
  validatePortfolioSlug,
} from "@/lib/member/portfolio/slug";
import { buildBlocksFromTemplate } from "@/lib/member/portfolio/templates";
import type { PortfolioTemplateId } from "@/lib/member/portfolio/types";
import { createClient } from "@/lib/supabase/server";

export type PortfolioActionState = {
  ok: boolean;
  message: string;
  slug?: string;
  imagePath?: string;
  previewKey?: string;
};

function revalidatePortfolio(slug?: string) {
  revalidatePath("/member/portfolio");
  revalidatePath("/portfolio/preview");
  if (slug) revalidatePath(`/portfolio/${slug}`);
}

export async function createPortfolioFromTemplate(
  templateIdRaw: string,
): Promise<PortfolioActionState> {
  const gate = await requirePortfolioStudent();
  if (gate.error || !gate.profile) return gate.error!;

  const templateParsed = portfolioTemplateSchema.safeParse(templateIdRaw);
  if (!templateParsed.success) {
    return { ok: false, message: "Pick a valid template." };
  }
  const templateId = templateParsed.data;

  const existing = await fetchOwnPortfolio(gate.profile.id);
  if (existing) {
    return { ok: false, message: "You already have a portfolio. Open the editor." };
  }

  const baseSlug = suggestSlugFromName(gate.profile.full_name);
  const slug = await allocateUniqueSlug(baseSlug, gate.profile.id);
  const { blocks, themeId } = buildBlocksFromTemplate(templateId, {
    fullName: gate.profile.full_name,
    occupation: gate.profile.occupation,
  });

  const supabase = await createClient();
  const { error } = await supabase.from("student_portfolios").insert({
    student_id: gate.profile.id,
    slug,
    template_id: templateId,
    theme_id: themeId,
    blocks,
  });

  if (error) {
    return { ok: false, message: error.message ?? "Could not create portfolio." };
  }

  revalidatePortfolio(slug);
  return { ok: true, message: "Portfolio created.", slug };
}

export async function applyPortfolioTemplate(
  templateIdRaw: string,
): Promise<PortfolioActionState> {
  const gate = await requirePortfolioStudent();
  if (gate.error || !gate.profile) return gate.error!;

  const templateParsed = portfolioTemplateSchema.safeParse(templateIdRaw);
  if (!templateParsed.success) {
    return { ok: false, message: "Pick a valid template." };
  }
  const templateId = templateParsed.data;

  const { blocks, themeId } = buildBlocksFromTemplate(templateId, {
    fullName: gate.profile.full_name,
    occupation: gate.profile.occupation,
  });

  const supabase = await createClient();
  const { error } = await supabase
    .from("student_portfolios")
    .update({
      blocks,
      theme_id: themeId,
      template_id: templateId,
      updated_at: new Date().toISOString(),
    })
    .eq("student_id", gate.profile.id);

  if (error) {
    return { ok: false, message: error.message ?? "Could not reset template." };
  }

  const row = await fetchOwnPortfolio(gate.profile.id);
  revalidatePortfolio(row?.slug);
  return { ok: true, message: "Template applied." };
}

export async function savePortfolioDraft(
  json: string,
): Promise<PortfolioActionState> {
  const gate = await requirePortfolioStudent();
  if (gate.error || !gate.profile) return gate.error!;

  let payload: unknown;
  try {
    payload = JSON.parse(json);
  } catch {
    return { ok: false, message: "Invalid save payload." };
  }

  const parsed = portfolioDraftSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: "Some fields are too long or invalid." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("student_portfolios")
    .update({
      blocks: parsed.data.blocks,
      theme_id: parsed.data.themeId,
      updated_at: new Date().toISOString(),
    })
    .eq("student_id", gate.profile.id);

  if (error) {
    return { ok: false, message: error.message ?? "Could not save." };
  }

  const row = await fetchOwnPortfolio(gate.profile.id);
  revalidatePortfolio(row?.slug);
  return { ok: true, message: "Saved." };
}

export async function updatePortfolioSettings(
  slugInput: string,
  isPublic: boolean,
): Promise<PortfolioActionState> {
  const gate = await requirePortfolioStudent();
  if (gate.error || !gate.profile) return gate.error!;

  const slug = normalizePortfolioSlug(slugInput);
  const slugError = validatePortfolioSlug(slug);
  if (slugError) return { ok: false, message: slugError };

  if (await isSlugTaken(slug, gate.profile.id)) {
    return { ok: false, message: "That URL slug is already taken." };
  }

  const existing = await fetchOwnPortfolio(gate.profile.id);
  if (!existing) {
    return { ok: false, message: "Create a portfolio first." };
  }

  const publishedAt =
    isPublic && !existing.published_at
      ? new Date().toISOString()
      : existing.published_at;

  const supabase = await createClient();
  const { error } = await supabase
    .from("student_portfolios")
    .update({
      slug,
      is_public: isPublic,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("student_id", gate.profile.id);

  if (error) {
    return { ok: false, message: error.message ?? "Could not update settings." };
  }

  if (existing.slug !== slug) {
    revalidatePath(`/portfolio/${existing.slug}`);
  }
  revalidatePortfolio(slug);
  return { ok: true, message: isPublic ? "Portfolio is public." : "Portfolio is private.", slug };
}

export async function uploadPortfolioImage(
  blockId: string,
  formData: FormData,
): Promise<PortfolioActionState> {
  const gate = await requirePortfolioStudent();
  if (gate.error || !gate.profile) return gate.error!;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose an image to upload." };
  }
  if (
    !PORTFOLIO_IMAGE_MIME.includes(file.type as (typeof PORTFOLIO_IMAGE_MIME)[number])
  ) {
    return { ok: false, message: "Use a WebP, JPEG, or PNG photo." };
  }
  if (file.size > PORTFOLIO_IMAGE_MAX_BYTES) {
    return { ok: false, message: "Photo must be 3MB or smaller." };
  }
  const ext = extFromPortfolioMime(file.type);
  if (!ext) return { ok: false, message: "Unsupported image type." };

  if (!/^[0-9a-f-]{36}$/i.test(blockId)) {
    return { ok: false, message: "Invalid block." };
  }

  const path = portfolioImageObjectPath(gate.profile.id, blockId, ext);
  const supabase = await createClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(PORTFOLIO_IMAGE_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (error) return { ok: false, message: error.message };

  revalidatePortfolio();
  return {
    ok: true,
    message: "Image uploaded.",
    imagePath: path,
    previewKey: blockId,
  };
}
