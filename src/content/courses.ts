export type CatalogCourseType = "FOUNDATION" | "UPSKILL";

export type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  courseType: CatalogCourseType;
  /** Public register path — only for featured Foundation course */
  registerPath?: string;
};

export const foundationCourses: CatalogCourse[] = [
  {
    id: "medical-va-masterclass",
    slug: "medical-va-masterclass",
    title: "Medical VA Masterclass",
    subtitle: "Front desk, workflow, and Medical VA fundamentals",
    description:
      "Build your first Medical VA foundation — patient intake, scheduling basics, and day-to-day workflow from a Bisaya-English coach.",
    price: 499,
    courseType: "FOUNDATION",
  },
  {
    id: "medical-billing-masterclass",
    slug: "medical-billing-masterclass",
    title: "Medical Billing Masterclass",
    subtitle: "Medical Billing fundamentals for aspiring Medical VAs",
    description:
      "Core Medical Billing concepts, terminology, and where billing sits in the revenue cycle. Dili full job-ready claim — usa ka solid starting point.",
    price: 499,
    courseType: "FOUNDATION",
    registerPath: "/register",
  },
];

export const upskillCourses: CatalogCourse[] = [
  {
    id: "insurance-verification",
    slug: "insurance-verification",
    title: "Insurance Verification",
    subtitle: "Eligibility & benefits",
    description:
      "Confirm coverage, benefits, and patient responsibility before the claim path starts.",
    price: 1000,
    courseType: "UPSKILL",
  },
  {
    id: "claims",
    slug: "claims",
    title: "Claims",
    subtitle: "Clean claim workflow",
    description:
      "Prepare, check, and submit claims with fewer preventable denials.",
    price: 1000,
    courseType: "UPSKILL",
  },
  {
    id: "denials",
    slug: "denials",
    title: "Denials",
    subtitle: "Appeals & rework",
    description:
      "Read denial reasons, prioritize rework, and improve follow-through.",
    price: 1000,
    courseType: "UPSKILL",
  },
];

export const allCatalogCourses: CatalogCourse[] = [
  ...foundationCourses,
  ...upskillCourses,
];

export function getCatalogCourseBySlug(slug: string): CatalogCourse | undefined {
  return allCatalogCourses.find((course) => course.slug === slug);
}

export function isCheckoutSlug(slug: string): boolean {
  return allCatalogCourses.some(
    (course) => course.slug === slug && !course.registerPath,
  );
}

export function courseCheckoutPath(slug: string): string {
  return `/member/checkout/${slug}`;
}

export const courseCatalog = {
  foundation: foundationCourses,
  upskill: upskillCourses,
} as const;
