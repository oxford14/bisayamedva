import Link from "next/link";
import { site } from "@/content/site";
import { formatPeso } from "@/lib/utils";

export function MobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-navy/10 bg-cream/95 p-3 backdrop-blur-md md:hidden">
      <Link
        href="/register"
        className="flex min-h-12 cursor-pointer items-center justify-center rounded-[10px] bg-teal px-4 text-base font-semibold text-white shadow-[0_8px_20px_rgba(12,122,112,0.2)]"
      >
        Register — {formatPeso(site.featuredCourse.price)}
      </Link>
    </div>
  );
}
