import type { Metadata } from "next";
import { AuthShell } from "@/components/forms/auth-shell";
import { RegisterFlow } from "@/components/forms/register-flow";
import { getFeaturedOffer } from "@/lib/content/featured-offer";
import { formatPeso } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const offer = await getFeaturedOffer();
  return {
    title: "Register",
    description: `Register for ${offer.course.name} — ${formatPeso(offer.course.price)} one-time weekend training.`,
  };
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ ref?: string }>;
}) {
  const offer = await getFeaturedOffer();
  const params = searchParams ? await searchParams : {};
  const refCode = params.ref?.trim() || undefined;
  return (
    <AuthShell image="hero">
      <RegisterFlow course={offer.course} refCode={refCode} />
    </AuthShell>
  );
}
