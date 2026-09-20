import {
  createAboutBlock,
  createCertificationsBlock,
  createExperienceBlock,
  createHeroBlock,
  createImageBlock,
  createLinksBlock,
  createSkillsBlock,
} from "@/lib/member/portfolio/blocks-factory";
import type {
  PortfolioBlock,
  PortfolioTemplateId,
  PortfolioThemeId,
} from "@/lib/member/portfolio/types";

export type PortfolioTemplateMeta = {
  id: PortfolioTemplateId;
  themeId: PortfolioThemeId;
  title: string;
  description: string;
  accentClass: string;
};

export const PORTFOLIO_TEMPLATES: PortfolioTemplateMeta[] = [
  {
    id: "classic-medva",
    themeId: "classic",
    title: "Classic Medical VA",
    description:
      "Hero, about, skills, certifications, and contact links — solid starter for clinic-facing work.",
    accentClass: "from-navy/10 to-teal/20",
  },
  {
    id: "clean-pro",
    themeId: "minimal",
    title: "Clean professional",
    description:
      "Experience-first layout with skills and links — good if naa na kay prior admin or VA background.",
    accentClass: "from-cream to-white",
  },
  {
    id: "visual-showcase",
    themeId: "visual",
    title: "Visual showcase",
    description:
      "Photo-forward hero plus a highlight image — great for remote-ready branding.",
    accentClass: "from-teal/25 to-cream",
  },
];

export type TemplateSeedContext = {
  fullName: string;
  occupation: string | null;
};

export function buildBlocksFromTemplate(
  templateId: PortfolioTemplateId,
  ctx: TemplateSeedContext,
): { blocks: PortfolioBlock[]; themeId: PortfolioThemeId } {
  const headline =
    ctx.occupation?.trim() ||
    "Medical Virtual Assistant — training in progress";

  const hero = createHeroBlock({
    displayName: ctx.fullName,
    headline,
  });

  switch (templateId) {
    case "classic-medva":
      return {
        themeId: "classic",
        blocks: [
          hero,
          createAboutBlock({
            body:
              "I am building US clinic-ready skills in patient intake, Insurance basics, and professional communication through Bisaya MedVA training.",
          }),
          createSkillsBlock({
            items: [
              "Patient registration",
              "Scheduling",
              "Phone etiquette",
              "Medical Terminology",
              "HIPAA awareness",
            ],
          }),
          createCertificationsBlock({
            items: [
              {
                name: "Medical VA Masterclass",
                issuer: "Bisaya MedVA",
                year: "",
                link: "",
              },
            ],
          }),
          createLinksBlock(),
        ],
      };
    case "clean-pro":
      return {
        themeId: "minimal",
        blocks: [
          hero,
          createExperienceBlock({
            entries: [
              {
                role: "Administrative / customer support",
                organization: "Previous employer",
                period: "Year – Year",
                bullets: [
                  "Handled inquiries and documentation",
                  "Maintained accurate records",
                ],
              },
            ],
          }),
          createSkillsBlock({
            items: [
              "EHR navigation",
              "Eligibility basics",
              "Claims awareness",
              "English communication",
            ],
          }),
          createAboutBlock(),
          createLinksBlock(),
        ],
      };
    case "visual-showcase":
      return {
        themeId: "visual",
        blocks: [
          hero,
          createImageBlock({
            alt: "Workspace or training highlight",
            caption: "Remote-ready workspace",
          }),
          createAboutBlock(),
          createSkillsBlock({
            items: ["Medical Billing basics", "Scheduling", "Mock call practice"],
          }),
          createCertificationsBlock(),
        ],
      };
    default:
      return buildBlocksFromTemplate("classic-medva", ctx);
  }
}

export function getTemplateMeta(id: PortfolioTemplateId) {
  return PORTFOLIO_TEMPLATES.find((t) => t.id === id) ?? PORTFOLIO_TEMPLATES[0];
}
