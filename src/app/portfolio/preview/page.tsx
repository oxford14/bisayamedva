import { redirect } from "next/navigation";
import { PublicPortfolioView } from "@/components/portfolio/public-portfolio-view";
import { canAccessPortfolio } from "@/lib/member/portfolio/access";
import { fetchOwnPortfolio } from "@/lib/member/portfolio/data";
import { hydratePortfolioImageUrls } from "@/lib/member/portfolio/public";
import { createAvatarSignedUrl } from "@/lib/member/avatar";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PortfolioOwnerPreviewPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login?next=/member/portfolio");

  const allowed = await canAccessPortfolio(profile.id, profile.role);
  if (!allowed) redirect("/member/portfolio");

  const row = await fetchOwnPortfolio(profile.id);
  if (!row) redirect("/member/portfolio");

  const blocks = await hydratePortfolioImageUrls(row.blocks);
  const supabase = await createClient();
  const avatarUrl = profile.avatar_path
    ? await createAvatarSignedUrl(supabase, profile.avatar_path)
    : null;

  return (
    <PublicPortfolioView
      previewBanner
      portfolio={{
        slug: row.slug,
        themeId: row.theme_id,
        blocks,
        studentName: profile.full_name,
        avatarUrl,
      }}
    />
  );
}
