import { formatPeso } from "@/lib/utils";

export type CatalogTopic = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
};

export type CatalogBundle = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  subtitle: string;
  description: string;
  price: number;
  format: string;
  topics: CatalogTopic[];
  available: boolean;
  ctaLabel: string;
  ctaHref: string;
};

export const coreBeginnerTopics: CatalogTopic[] = [
  {
    id: "basic-medva-front-desk",
    title: "Basic Medical VA — Front Desk Fundamentals",
    subtitle: "Front desk workflow",
    description:
      "Patient intake, scheduling basics, and front-desk communication for aspiring Medical VAs.",
    price: 0,
  },
  {
    id: "basic-medical-billing",
    title: "Basic Medical Billing — Billing Fundamentals",
    subtitle: "Billing foundation",
    description:
      "Core Medical Billing concepts, terminology, and where billing sits in the revenue cycle.",
    price: 0,
  },
  {
    id: "hipaa-privacy",
    title: "HIPAA & Healthcare Privacy — Practical HIPAA Training",
    subtitle: "Privacy essentials",
    description:
      "Practical HIPAA awareness for day-to-day Medical VA work — klaro, not legalese overload.",
    price: 0,
  },
];

export const deepDiveTopics: CatalogTopic[] = [
  {
    id: "insurance-verification",
    title: "Insurance Verification",
    subtitle: "Eligibility & benefits",
    description:
      "Confirm coverage, benefits, and patient responsibility before the claim path starts.",
    price: 1000,
  },
  {
    id: "claims-processing",
    title: "Claims Processing & Submission",
    subtitle: "Clean claim workflow",
    description:
      "Prepare, check, and submit claims with fewer preventable denials.",
    price: 1200,
  },
  {
    id: "payment-posting",
    title: "Payment Posting",
    subtitle: "Posting & reconciliation",
    description:
      "Post payer payments accurately and keep patient accounts balanced.",
    price: 1100,
  },
  {
    id: "denial-management",
    title: "Denial Management",
    subtitle: "Appeals & rework",
    description:
      "Read denial reasons, prioritize rework, and improve follow-through.",
    price: 1300,
  },
  {
    id: "ar-collections",
    title: "A/R & Collections",
    subtitle: "Aging & follow-up",
    description:
      "Work aged receivables and patient balances with a clear follow-up rhythm.",
    price: 1200,
  },
  {
    id: "credentialing",
    title: "Credentialing & Provider Enrollment",
    subtitle: "Enrollment pathway",
    description:
      "Understand credentialing packets, payer enrollment, and status tracking.",
    price: 1400,
  },
];

export const coreBeginnerBundle: CatalogBundle = {
  id: "core-beginner",
  slug: "core-beginner-bundle",
  title: "Core Beginner Bundle",
  eyebrow: "Starter path",
  subtitle: "Front desk, Medical Billing basics, and practical HIPAA",
  description:
    "Usa ka low-cost starting bundle for aspiring Medical VAs. Builds a usable foundation — dili full job-ready claim.",
  price: 200,
  format: "Weekend online training",
  topics: coreBeginnerTopics,
  available: true,
  ctaLabel: "Enroll for ₱200",
  ctaHref: "/register",
};

export const deepDiveBundle: CatalogBundle = {
  id: "full-deep-dive",
  slug: "full-medva-deep-dive",
  title: "Full MedVA Deep Dive Bundle",
  eyebrow: "Live Zoom",
  subtitle: "Six specialized Medical VA topics in one discounted path",
  description:
    "Deep-dive training across Insurance Verification, Claims, Payment Posting, Denials, A/R, and Credentialing. Live Zoom sessions. Pay with the same in-app QR Ph checkout.",
  price: 2499,
  format: "Live Zoom training",
  topics: deepDiveTopics,
  available: true,
  ctaLabel: "Pay ₱2,499",
  ctaHref: "/member/checkout/deep-dive",
};

export function deepDiveRegularTotal() {
  return deepDiveTopics.reduce((sum, topic) => sum + topic.price, 0);
}

export function deepDiveSavings() {
  return deepDiveRegularTotal() - deepDiveBundle.price;
}

export function deepDiveSavingsPercent() {
  const regular = deepDiveRegularTotal();
  if (regular <= 0) return 0;
  return Math.round((deepDiveSavings() / regular) * 100);
}

export function deepDivePricingSummary() {
  const regular = deepDiveRegularTotal();
  const savings = deepDiveSavings();
  return {
    regular,
    bundle: deepDiveBundle.price,
    savings,
    percent: deepDiveSavingsPercent(),
    regularLabel: formatPeso(regular),
    bundleLabel: formatPeso(deepDiveBundle.price),
    savingsLabel: formatPeso(savings),
  };
}

export const courseCatalog = {
  core: coreBeginnerBundle,
  deepDive: deepDiveBundle,
  deepDiveTopics,
} as const;
