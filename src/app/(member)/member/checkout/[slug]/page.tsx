import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CourseCheckoutPanel } from "@/components/member/course-checkout-panel";
import { Button } from "@/components/ui/button";
import { MemberPageHeader } from "@/components/member/ui";
import { getCatalogCourseBySlug, isCheckoutSlug } from "@/content/courses";
import { getMemberCheckoutReview } from "@/lib/member/checkout-prepare";
import { getStudentProfile } from "@/lib/supabase/auth";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session?: string }>;
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
  const { session: sessionId } = await searchParams;

  if (slug === "deep-dive") {
    redirect("/member/course");
  }

  const course = getCatalogCourseBySlug(slug);
  if (!course || !isCheckoutSlug(slug)) {
    notFound();
  }

  if (!sessionId) {
    return (
      <div>
        <MemberPageHeader
          title={`${course.title} enrollment`}
          description="Select an open weekend schedule first."
        />
        <div className="rounded-2xl border border-dashed border-border bg-cream/60 px-6 py-12 text-center">
          <p className="font-semibold text-ink">No schedule selected</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Go back to Courses, click Enroll, and pick an open schedule.
          </p>
          <Button variant="accent" className="mt-5" asChild>
            <Link href="/member/course">Back to Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  const profile = await getStudentProfile();
  const review = await getMemberCheckoutReview(slug, profile.id, sessionId);

  return (
    <div>
      <MemberPageHeader
        title={`${course.title} enrollment`}
        description="Review your schedule and promo, then proceed to pay."
      />
      <CourseCheckoutPanel
        slug={slug}
        sessionId={sessionId}
        courseTitle={course.title}
        review={review.ok ? review : null}
        reviewError={review.ok ? null : review.error}
      />
    </div>
  );
}
