import { z } from "zod";
import {
  PORTFOLIO_TEMPLATE_IDS,
  PORTFOLIO_THEME_IDS,
} from "@/lib/member/portfolio/types";

const shortText = z.string().trim().max(200);
const mediumText = z.string().trim().max(2000);
const longText = z.string().trim().max(8000);
const urlText = z.string().trim().max(500);

const heroBlock = z.object({
  id: z.string().uuid(),
  type: z.literal("hero"),
  props: z.object({
    displayName: shortText,
    headline: mediumText,
    imagePath: z.string().max(500).nullable(),
  }),
});

const aboutBlock = z.object({
  id: z.string().uuid(),
  type: z.literal("about"),
  props: z.object({
    title: shortText,
    body: longText,
  }),
});

const skillsBlock = z.object({
  id: z.string().uuid(),
  type: z.literal("skills"),
  props: z.object({
    title: shortText,
    items: z.array(shortText).max(40),
  }),
});

const experienceBlock = z.object({
  id: z.string().uuid(),
  type: z.literal("experience"),
  props: z.object({
    title: shortText,
    entries: z
      .array(
        z.object({
          role: shortText,
          organization: shortText,
          period: shortText,
          bullets: z.array(mediumText).max(12),
        }),
      )
      .max(20),
  }),
});

const certificationsBlock = z.object({
  id: z.string().uuid(),
  type: z.literal("certifications"),
  props: z.object({
    title: shortText,
    items: z
      .array(
        z.object({
          name: shortText,
          issuer: shortText,
          year: z.string().trim().max(20),
          link: urlText,
        }),
      )
      .max(20),
  }),
});

const imageBlock = z.object({
  id: z.string().uuid(),
  type: z.literal("image"),
  props: z.object({
    imagePath: z.string().max(500).nullable(),
    caption: mediumText,
    alt: shortText,
  }),
});

const linksBlock = z.object({
  id: z.string().uuid(),
  type: z.literal("links"),
  props: z.object({
    title: shortText,
    links: z
      .array(
        z.object({
          label: shortText,
          url: urlText,
        }),
      )
      .max(20),
  }),
});

const dividerBlock = z.object({
  id: z.string().uuid(),
  type: z.literal("divider"),
  props: z.object({}).strict(),
});

export const portfolioBlockSchema = z.discriminatedUnion("type", [
  heroBlock,
  aboutBlock,
  skillsBlock,
  experienceBlock,
  certificationsBlock,
  imageBlock,
  linksBlock,
  dividerBlock,
]);

export const portfolioBlocksSchema = z
  .array(portfolioBlockSchema)
  .max(40)
  .superRefine((blocks, ctx) => {
    const imageCount = blocks.filter(
      (b) =>
        b.type === "image" ||
        (b.type === "hero" && b.props.imagePath),
    ).length;
    if (imageCount > 12) {
      ctx.addIssue({
        code: "custom",
        message: "Too many images (max 12).",
      });
    }
  });

export const portfolioDraftSchema = z.object({
  blocks: portfolioBlocksSchema,
  themeId: z.enum(PORTFOLIO_THEME_IDS),
});

export const portfolioSettingsSchema = z.object({
  slug: z.string().min(3).max(48),
  isPublic: z.boolean(),
});

export const portfolioTemplateSchema = z.enum(PORTFOLIO_TEMPLATE_IDS);

export function parsePortfolioBlocks(raw: unknown) {
  return portfolioBlocksSchema.safeParse(raw);
}
