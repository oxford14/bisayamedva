"use client";

import { useTransition } from "react";
import { createPortfolioFromTemplate } from "@/app/(member)/member/portfolio-actions";
import { Button } from "@/components/ui/button";
import { portfolioCopy } from "@/content/site";
import { PortfolioBlocksView } from "@/lib/member/portfolio/render-blocks";
import {
  buildBlocksFromTemplate,
  PORTFOLIO_TEMPLATES,
} from "@/lib/member/portfolio/templates";
import type { PortfolioTemplateId } from "@/lib/member/portfolio/types";

const SAMPLE_CTX = {
  fullName: "Maria Santos",
  occupation: "Medical Virtual Assistant",
};

function TemplatePreview({ templateId }: { templateId: PortfolioTemplateId }) {
  const { blocks, themeId } = buildBlocksFromTemplate(templateId, SAMPLE_CTX);
  const previewBlocks = blocks.slice(0, 4);

  return (
    <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl border border-navy/10 bg-cream">
      <div
        className="pointer-events-none absolute inset-0 origin-top-left scale-[0.32] overflow-hidden"
        style={{ width: "312.5%", height: "312.5%" }}
      >
        <PortfolioBlocksView
          blocks={previewBlocks}
          themeId={themeId}
          mode="view"
          compact
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-cream to-transparent"
      />
    </div>
  );
}

export function PortfolioTemplatePicker({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function pick(templateId: string) {
    startTransition(async () => {
      const result = await createPortfolioFromTemplate(templateId);
      if (result.ok) onCreated();
      else alert(result.message);
    });
  }

  return (
    <div>
      <p className="max-w-2xl text-sm text-muted">{portfolioCopy.templateIntro}</p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {PORTFOLIO_TEMPLATES.map((template) => (
          <article
            key={template.id}
            className="flex flex-col rounded-2xl border border-navy/10 bg-white p-5 shadow-[0_8px_24px_rgba(47,56,38,0.04)]"
          >
            <TemplatePreview templateId={template.id} />
            <h3 className="font-display text-lg font-semibold text-navy">
              {template.title}
            </h3>
            <p className="mt-2 flex-1 text-sm text-muted">{template.description}</p>
            <Button
              type="button"
              variant="accent"
              className="mt-5 w-full"
              disabled={pending}
              onClick={() => pick(template.id)}
            >
              {pending ? "Setting up…" : portfolioCopy.useTemplate}
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
