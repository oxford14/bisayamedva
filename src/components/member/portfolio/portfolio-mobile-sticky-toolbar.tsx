import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { portfolioCopy } from "@/content/site";
import { cn } from "@/lib/utils";

export const portfolioMobileToolbarNavClass = cn(
  "fixed inset-x-0 bottom-0 z-50 border-t border-navy/15 bg-cream/98 shadow-[0_-12px_32px_rgba(47,56,38,0.12)] backdrop-blur-md lg:hidden",
  "pb-[env(safe-area-inset-bottom,0px)]",
);

const itemClass =
  "flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold text-navy";

/** When bottom member nav is hidden but editor toolbar is not shown yet (gate, template pick). */
export function PortfolioMobileStickyHomeOnly() {
  return (
    <nav
      className={portfolioMobileToolbarNavClass}
      aria-label={portfolioCopy.mobileToolbarLabel}
    >
      <div className="mx-auto grid max-w-lg grid-cols-3 px-1.5 py-2">
        <Link
          href="/member"
          className={itemClass}
          aria-label={portfolioCopy.backToHome}
        >
          <ArrowLeft className="size-5" aria-hidden />
          {portfolioCopy.mobileHome}
        </Link>
      </div>
    </nav>
  );
}

export function PortfolioMobileHomeToolbarItem() {
  return (
    <Link
      href="/member"
      className={itemClass}
      aria-label={portfolioCopy.backToHome}
    >
      <ArrowLeft className="size-5" aria-hidden />
      {portfolioCopy.mobileHome}
    </Link>
  );
}
