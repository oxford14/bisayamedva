"use client";

import { Plus } from "lucide-react";
import { applyPortfolioTemplate } from "@/app/(member)/member/portfolio-actions";
import {
  addBlockOfType,
  BLOCK_LABELS,
} from "@/components/member/portfolio/portfolio-block-labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { portfolioCopy } from "@/content/site";
import { PORTFOLIO_TEMPLATES } from "@/lib/member/portfolio/templates";
import type { PortfolioBlock, PortfolioBlockType } from "@/lib/member/portfolio/types";

export function PortfolioSettingsRail({
  slug,
  onSlugChange,
  onSlugBlur,
  onAddBlock,
  showSlug = true,
  showTemplateReset = true,
}: {
  slug: string;
  onSlugChange: (slug: string) => void;
  onSlugBlur: () => void;
  onAddBlock: (block: PortfolioBlock) => void;
  showSlug?: boolean;
  showTemplateReset?: boolean;
}) {
  return (
    <div className="space-y-4">
      {showSlug ? (
      <div>
        <p className="text-xs font-semibold tracking-wide text-navy/60 uppercase">
          {portfolioCopy.urlSlug}
        </p>
        <div className="mt-2 flex gap-2">
          <Input
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            onBlur={onSlugBlur}
          />
        </div>
        <p className="mt-1 text-xs text-muted">/portfolio/{slug}</p>
      </div>
      ) : null}

      <div>
        <p className="text-xs font-semibold tracking-wide text-navy/60 uppercase">
          {portfolioCopy.addBlock}
        </p>
        <ul className="mt-2 space-y-1">
          {(Object.keys(BLOCK_LABELS) as PortfolioBlockType[]).map((type) => (
            <li key={type}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => onAddBlock(addBlockOfType(type))}
              >
                <Plus className="size-3.5" />
                {BLOCK_LABELS[type]}
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {showTemplateReset ? (
      <div>
        <p className="text-xs font-semibold tracking-wide text-navy/60 uppercase">
          {portfolioCopy.resetTemplate}
        </p>
        <select
          className="mt-2 w-full rounded-[10px] border border-border bg-white px-2 py-2 text-sm"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            if (!window.confirm(portfolioCopy.resetConfirm)) {
              e.target.value = "";
              return;
            }
            void applyPortfolioTemplate(v).then((r) => {
              if (!r.ok) alert(r.message);
              else window.location.reload();
            });
            e.target.value = "";
          }}
        >
          <option value="">Choose template…</option>
          {PORTFOLIO_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>
      ) : null}
    </div>
  );
}
