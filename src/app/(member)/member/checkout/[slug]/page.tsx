import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CourseCheckoutPanel } from "@/components/member/course-checkout-panel";
import { MemberPageHeader } from "@/components/member/ui";
import { getCatalogCourseBySlug, isCheckoutSlug } from "@/content/courses";
import { getMemberCheckoutReview } from "@/lib/member/checkout-prepare";
import { getStudentProfile } from "@/lib/supabase/auth";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ promo?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = getCatalogCourseBySlug(slug);
  if (!course || !isCheckoutSlug(slug)) {
    return { title: "Checkout" };
  }
  return {
    title: `Enroll · ${course.title}`,
    description: `Wallet enroll or top-up for ${course.title}.`,
  };
}

export default async function CourseCheckoutPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const { promo: initialPromoCode } = await searchParams;

  if (slug === "deep-dive") {
    redirect("/member/course");
  }

  const course = getCatalogCourseBySlug(slug);
  if (!course || !isCheckoutSlug(slug)) {
    notFound();
  }

  const profile = await getStudentProfile();
  const review = await getMemberCheckoutReview(slug, profile.id);

  return (
    <div>
      <MemberPageHeader
        title={`${course.title} enrollment`}
        description="Review your course and promo, then proceed to pay."
      />
      <CourseCheckoutPanel
        slug={slug}
        courseTitle={course.title}
        review={review.ok ? review : null}
        reviewError={review.ok ? null : review.error}
        initialPromoCode={initialPromoCode?.trim() || null}
      />
    </div>
  );
}
