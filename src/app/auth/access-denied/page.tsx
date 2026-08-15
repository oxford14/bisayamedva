import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function AccessDeniedPage() {
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
          Admin access required
        </h1>
        <p className="mt-3 text-muted">
          Your account is signed in, but it does not have an Admin or Super Admin
          role.
        </p>
        <Button variant="accent" className="mt-8" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
