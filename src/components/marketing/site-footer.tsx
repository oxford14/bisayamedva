import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/marketing/container";
import { nav, site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-navy/8 bg-navy text-cream">
      <Container className="grid gap-10 py-16 md:grid-cols-[1.5fr_1fr_1fr] lg:py-20">
        <div className="space-y-4">
          <Logo inverted />
          <p className="max-w-sm text-sm leading-relaxed text-cream/70">
            {site.tagline}. Local in identity, global in ambition.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-cream/50 uppercase">
            Explore
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {nav.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-cream/80 hover:text-cream cursor-pointer"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={nav.register.href}
                className="text-cream/80 hover:text-cream cursor-pointer"
              >
                {nav.register.label}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-cream/50 uppercase">
            Contact
          </p>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            <li>
              <a
                href={`mailto:${site.email}`}
                className="hover:text-cream cursor-pointer"
              >
                {site.email}
              </a>
            </li>
            <li>{site.domain}</li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="py-5">
          <p className="text-xs text-cream/50">
            © {new Date().getFullYear()} {site.name}. Medical VA Training & Career
            Development.
          </p>
        </Container>
      </div>
    </footer>
  );
}
