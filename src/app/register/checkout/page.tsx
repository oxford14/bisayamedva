import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/forms/auth-shell";
import { Button } from "@/components/ui/button";
import { authCopy, site } from "@/content/site";
import { formatPeso } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Checkout",
  description: `PayMongo checkout for ${site.featuredCourse.name} comes next.`,
};

export default function CheckoutPage() {
  return (
    <AuthShell>
      <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
        {authCopy.checkout.eyebrow}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-navy">
        {authCopy.checkout.title}
      </h1>
      <p className="mt-3 leading-relaxed text-muted">{authCopy.checkout.body}</p>
      <div className="mt-6 rounded-2xl border border-border bg-white p-5">
        <p className="text-sm text-muted">{site.featuredCourse.name}</p>
        <p className="mt-1 font-display text-4xl font-semibold text-navy">
          {formatPeso(site.featuredCourse.price)}
        </p>
        <p className="mt-2 text-sm text-muted">
          {site.nextSession.day} · {site.nextSession.startTime}–
          {site.nextSession.endTime} {site.nextSession.timezoneLabel}
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" className="flex-1" asChild>
          <Link href="/register">{authCopy.checkout.back}</Link>
        </Button>
        <Button variant="primary" className="flex-1" asChild>
          <Link href="/">{authCopy.checkout.home}</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
