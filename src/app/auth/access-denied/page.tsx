import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { getCurrentProfile, isStudentRole } from "@/lib/supabase/auth";

export default async function AccessDeniedPage() {
  const profile = await getCurrentProfile();
  const studentHome = isStudentRole(profile?.role);

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <div className="px-5 py-6 sm:px-8">
        <Logo />
      </div>
      <div className="mx-auto flex flex-1 max-w-lg flex-col items-center justify-center px-4 pb-16 text-center">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-navy/50 uppercase">
          Access
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink">
          Dili available ang page
        </h1>
        <p className="mt-3 text-muted">
          {studentHome
            ? "This page is for Admin accounts. Balik sa imong training dashboard."
            : "Your account is signed in, but it does not have access to this page."}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {studentHome ? (
            <Button variant="accent" asChild>
              <Link href="/member">Back to my training</Link>
            </Button>
          ) : null}
          <Button variant={studentHome ? "secondary" : "accent"} asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
