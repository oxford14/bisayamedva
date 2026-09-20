import { PortfolioGate } from "@/components/member/portfolio/portfolio-gate";
import { PortfolioMobileStickyHomeOnly } from "@/components/member/portfolio/portfolio-mobile-sticky-toolbar";
import { PortfolioHub } from "@/components/member/portfolio/portfolio-hub";
import { MemberPageHeader } from "@/components/member/ui";
import { portfolioCopy } from "@/content/site";
import { canAccessPortfolio } from "@/lib/member/portfolio/access";
import {
  buildImagePreviewUrls,
  fetchOwnPortfolio,
} from "@/lib/member/portfolio/data";
import { enrichProfileWithAvatar, getStudentProfile } from "@/lib/supabase/auth";

export default async function MemberPortfolioPage() {
  const profile = await enrichProfileWithAvatar(await getStudentProfile());
  const allowed = await canAccessPortfolio(profile.id, profile.role);

  if (!allowed) {
    return (
      <div>
        <MemberPageHeader
          title={portfolioCopy.pageTitle}
          description={portfolioCopy.pageDescription}
        />
        <PortfolioGate />
        <PortfolioMobileStickyHomeOnly />
      </div>
    );
  }

  const portfolio = await fetchOwnPortfolio(profile.id);
  const previewUrls = portfolio
    ? await buildImagePreviewUrls(portfolio.blocks)
    : {};

  return (
    <div>
      <MemberPageHeader
        title={portfolioCopy.pageTitle}
        description={portfolioCopy.pageDescription}
      />
      <PortfolioHub
        portfolio={portfolio}
        previewUrls={previewUrls}
        avatarUrl={profile.avatar_url}
      />
      {!portfolio ? <PortfolioMobileStickyHomeOnly /> : null}
    </div>
  );
}
