export type ModuleArtAsset = {
  src: string;
  alt: string;
};

const MODULE_ART: Record<string, ModuleArtAsset> = {
  claims: {
    src: "/images/modules/claims.png",
    alt: "3D clipboard and claim form for the Claims course.",
  },
  denials: {
    src: "/images/modules/denials.png",
    alt: "3D document stack for the Denials course.",
  },
  "insurance-verification": {
    src: "/images/modules/insurance-verification.png",
    alt: "3D insurance card for the Insurance Verification course.",
  },
  "medical-billing-masterclass": {
    src: "/images/modules/medical-billing-masterclass.png",
    alt: "3D invoice and calculator for the Medical Billing Masterclass.",
  },
  "medical-va-masterclass": {
    src: "/images/modules/medical-va-masterclass.png",
    alt: "3D laptop and headset for the Medical VA Masterclass.",
  },
};

const DEFAULT_ART: ModuleArtAsset = {
  src: "/images/modules/default.png",
  alt: "3D lesson blocks for this course.",
};

export function getModuleArt(slug: string): ModuleArtAsset {
  return MODULE_ART[slug] ?? DEFAULT_ART;
}

export function formatModuleCount(count: number, copy: {
  moduleCountOne: string;
  moduleCountOther: string;
}) {
  if (count === 1) return copy.moduleCountOne;
  return copy.moduleCountOther.replace("{n}", String(count));
}
