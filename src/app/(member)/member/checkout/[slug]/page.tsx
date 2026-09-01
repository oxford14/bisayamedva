import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CourseCheckoutPanel } from "@/components/member/course-checkout-panel";
import { MemberPageHeader } from "@/components/member/ui";
import { getCatalogCourseBySlug, isCheckoutSlug } from "@/content/courses";
import { prepareCoursePaymentForStudent } from "@/lib/member/checkout-prepare";
import { getStudentProfile } from "@/lib/supabase/auth";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = getCatalogCourseBySlug(slug);
  if (!course || course.registerPath) {
    return { title: "Checkout" };
  }
  return {
    title: `Pay · ${course.title}`,
    description: `PayMongo QR Ph checkout for ${course.title}.`,
  };
}

export default async function CourseCheckoutPage({ params }: Props) {
  const { slug } = await params;

  if (slug === "deep-dive") {
    redirect("/member/course");
  }

  const course = getCatalogCourseBySlug(slug);
  if (!course || course.registerPath || !isCheckoutSlug(slug)) {
    notFound();
  }

  const profile = await getStudentProfile();
  const prepared = await prepareCoursePaymentForStudent(slug, profile.id);

  if (prepared.ok && prepared.alreadyPaid) {
    redirect("/member/course");
  }

  return (
    <div>
      <MemberPageHeader
        title={`${course.title} payment`}
        description="Scan the live PayMongo QR Ph — same in-app payment style as registration."
      />
      <CourseCheckoutPanel
        slug={slug}
        courseTitle={course.title}
        initial={prepared.ok ? prepared : null}
        initialError={prepared.ok ? null : prepared.error}
      />
    </div>
  );
}
