export const PORTFOLIO_TEMPLATE_IDS = [
  "classic-medva",
  "clean-pro",
  "visual-showcase",
] as const;

export type PortfolioTemplateId = (typeof PORTFOLIO_TEMPLATE_IDS)[number];

export const PORTFOLIO_THEME_IDS = ["classic", "minimal", "visual"] as const;

export type PortfolioThemeId = (typeof PORTFOLIO_THEME_IDS)[number];

export type PortfolioBlockBase = { id: string };

export type HeroBlock = PortfolioBlockBase & {
  type: "hero";
  props: {
    displayName: string;
    headline: string;
    imagePath: string | null;
  };
};

export type AboutBlock = PortfolioBlockBase & {
  type: "about";
  props: {
    title: string;
    body: string;
  };
};

export type SkillsBlock = PortfolioBlockBase & {
  type: "skills";
  props: {
    title: string;
    items: string[];
  };
};

export type ExperienceEntry = {
  role: string;
  organization: string;
  period: string;
  bullets: string[];
};

export type ExperienceBlock = PortfolioBlockBase & {
  type: "experience";
  props: {
    title: string;
    entries: ExperienceEntry[];
  };
};

export type CertificationEntry = {
  name: string;
  issuer: string;
  year: string;
  link: string;
};

export type CertificationsBlock = PortfolioBlockBase & {
  type: "certifications";
  props: {
    title: string;
    items: CertificationEntry[];
  };
};

export type ImageBlock = PortfolioBlockBase & {
  type: "image";
  props: {
    imagePath: string | null;
    caption: string;
    alt: string;
  };
};

export type LinkEntry = {
  label: string;
  url: string;
};

export type LinksBlock = PortfolioBlockBase & {
  type: "links";
  props: {
    title: string;
    links: LinkEntry[];
  };
};

export type DividerBlock = PortfolioBlockBase & {
  type: "divider";
  props: Record<string, never>;
};

export type PortfolioBlock =
  | HeroBlock
  | AboutBlock
  | SkillsBlock
  | ExperienceBlock
  | CertificationsBlock
  | ImageBlock
  | LinksBlock
  | DividerBlock;

export type PortfolioRow = {
  student_id: string;
  slug: string;
  is_public: boolean;
  template_id: PortfolioTemplateId;
  theme_id: PortfolioThemeId;
  blocks: PortfolioBlock[];
  published_at: string | null;
  updated_at: string;
  created_at: string;
};

export type PublicPortfolio = {
  slug: string;
  themeId: PortfolioThemeId;
  blocks: PortfolioBlock[];
  studentName: string;
  avatarUrl: string | null;
};

export type PortfolioBlockType = PortfolioBlock["type"];

export const PORTFOLIO_BLOCK_TYPES: PortfolioBlockType[] = [
  "hero",
  "about",
  "skills",
  "experience",
  "certifications",
  "image",
  "links",
  "divider",
];
