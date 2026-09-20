"use client";

import { useRouter } from "next/navigation";
import { PortfolioBuilder } from "@/components/member/portfolio/portfolio-builder";
import { PortfolioTemplatePicker } from "@/components/member/portfolio/portfolio-template-picker";
import type { PortfolioRow } from "@/lib/member/portfolio/types";

export function PortfolioHub({
  portfolio,
  previewUrls,
  avatarUrl,
}: {
  portfolio: PortfolioRow | null;
  previewUrls: Record<string, string>;
  avatarUrl?: string | null;
}) {
  const router = useRouter();

  if (!portfolio) {
    return (
      <PortfolioTemplatePicker onCreated={() => router.refresh()} />
    );
  }

  return (
    <PortfolioBuilder
      initial={portfolio}
      initialPreviewUrls={previewUrls}
      avatarUrl={avatarUrl}
    />
  );
}
