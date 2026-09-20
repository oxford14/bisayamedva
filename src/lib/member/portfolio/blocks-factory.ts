import type {
  AboutBlock,
  CertificationsBlock,
  ExperienceBlock,
  HeroBlock,
  ImageBlock,
  LinksBlock,
  PortfolioBlock,
  SkillsBlock,
} from "@/lib/member/portfolio/types";

function id() {
  return crypto.randomUUID();
}

export function createHeroBlock(
  partial?: Partial<HeroBlock["props"]>,
): HeroBlock {
  return {
    id: id(),
    type: "hero",
    props: {
      displayName: partial?.displayName ?? "",
      headline: partial?.headline ?? "",
      imagePath: partial?.imagePath ?? null,
    },
  };
}

export function createAboutBlock(
  partial?: Partial<AboutBlock["props"]>,
): AboutBlock {
  return {
    id: id(),
    type: "about",
    props: {
      title: partial?.title ?? "About me",
      body: partial?.body ?? "",
    },
  };
}

export function createSkillsBlock(
  partial?: Partial<SkillsBlock["props"]>,
): SkillsBlock {
  return {
    id: id(),
    type: "skills",
    props: {
      title: partial?.title ?? "Skills",
      items: partial?.items ?? [],
    },
  };
}

export function createExperienceBlock(
  partial?: Partial<ExperienceBlock["props"]>,
): ExperienceBlock {
  return {
    id: id(),
    type: "experience",
    props: {
      title: partial?.title ?? "Experience",
      entries: partial?.entries ?? [
        {
          role: "",
          organization: "",
          period: "",
          bullets: [""],
        },
      ],
    },
  };
}

export function createCertificationsBlock(
  partial?: Partial<CertificationsBlock["props"]>,
): CertificationsBlock {
  return {
    id: id(),
    type: "certifications",
    props: {
      title: partial?.title ?? "Certifications",
      items: partial?.items ?? [
        { name: "", issuer: "", year: "", link: "" },
      ],
    },
  };
}

export function createImageBlock(
  partial?: Partial<ImageBlock["props"]>,
): ImageBlock {
  return {
    id: id(),
    type: "image",
    props: {
      imagePath: partial?.imagePath ?? null,
      caption: partial?.caption ?? "",
      alt: partial?.alt ?? "",
    },
  };
}

export function createLinksBlock(
  partial?: Partial<LinksBlock["props"]>,
): LinksBlock {
  return {
    id: id(),
    type: "links",
    props: {
      title: partial?.title ?? "Connect",
      links: partial?.links ?? [{ label: "Email", url: "" }],
    },
  };
}

export function createDividerBlock(): PortfolioBlock {
  return { id: id(), type: "divider", props: {} };
}

export function duplicateBlock(block: PortfolioBlock): PortfolioBlock {
  return structuredClone({ ...block, id: id() });
}
