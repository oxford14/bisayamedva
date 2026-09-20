import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicPortfolioView } from "@/components/portfolio/public-portfolio-view";
import { getPublicPortfolioBySlug } from "@/lib/member/portfolio/public";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const portfolio = await getPublicPortfolioBySlug(slug);
  if (!portfolio) {
    return { title: "Portfolio not found", robots: { index: false, follow: false } };
  }
  const hero = portfolio.blocks.find((b) => b.type === "hero");
  const headline =
    hero && hero.type === "hero" ? hero.props.headline : "Medical VA portfolio";
  return {
    title: `${portfolio.studentName} · Portfolio`,
    description: headline,
    robots: { index: false, follow: false },
  };
}

export default async function PublicPortfolioPage({ params }: Props) {
  const { slug } = await params;
  const portfolio = await getPublicPortfolioBySlug(slug);
  if (!portfolio) notFound();

  return <PublicPortfolioView portfolio={portfolio} />;
}
