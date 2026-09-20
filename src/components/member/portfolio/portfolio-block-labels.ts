import {
  createAboutBlock,
  createCertificationsBlock,
  createDividerBlock,
  createExperienceBlock,
  createHeroBlock,
  createImageBlock,
  createLinksBlock,
  createSkillsBlock,
} from "@/lib/member/portfolio/blocks-factory";
import type { PortfolioBlock, PortfolioBlockType } from "@/lib/member/portfolio/types";

export const BLOCK_LABELS: Record<PortfolioBlockType, string> = {
  hero: "Hero",
  about: "About",
  skills: "Skills",
  experience: "Experience",
  certifications: "Certifications",
  image: "Image",
  links: "Links",
  divider: "Divider",
};

export function addBlockOfType(type: PortfolioBlockType): PortfolioBlock {
  switch (type) {
    case "hero":
      return createHeroBlock();
    case "about":
      return createAboutBlock();
    case "skills":
      return createSkillsBlock();
    case "experience":
      return createExperienceBlock();
    case "certifications":
      return createCertificationsBlock();
    case "image":
      return createImageBlock();
    case "links":
      return createLinksBlock();
    case "divider":
      return createDividerBlock();
  }
}
