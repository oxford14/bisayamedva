import Link from "next/link";
import { PortfolioBlocksView } from "@/lib/member/portfolio/render-blocks";
import type { PublicPortfolio } from "@/lib/member/portfolio/types";

export function PublicPortfolioView({
  portfolio,
  previewBanner,
}: {
  portfolio: PublicPortfolio;
  previewBanner?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-cream">
      {previewBanner ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
          Preview mode — only you can see this until you turn on Public.
        </div>
      ) : null}
      <div className="border-b border-navy/10 bg-white/80 px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-semibold text-navy hover:text-teal"
          >
            Bisaya MedVA
          </Link>
          <p className="text-xs text-muted">Student portfolio</p>
        </div>
      </div>
      <PortfolioBlocksView
        blocks={portfolio.blocks}
        themeId={portfolio.themeId}
        avatarUrl={portfolio.avatarUrl}
      />
    </div>
  );
}
