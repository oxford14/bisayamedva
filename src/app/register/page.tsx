import type { Metadata } from "next";
import { AuthShell } from "@/components/forms/auth-shell";
import { RegisterFlow } from "@/components/forms/register-flow";
import { site } from "@/content/site";
import { formatPeso } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Register",
  description: `Register for ${site.featuredCourse.name} — ${formatPeso(site.featuredCourse.price)} one-time weekend training.`,
};

export default function RegisterPage() {
  return (
    <AuthShell image="hero">
      <RegisterFlow />
    </AuthShell>
  );
}
