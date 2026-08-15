import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Container, displayTitle, sectionPad } from "@/components/marketing/container";
import type { FeaturedOffer } from "@/lib/content/featured-offer";

const included = [
  "Medical Billing fundamentals",
  "Weekend online training session",
  "Student account access",
  "Attendance recorded by the coach",
  "Pathway to future Upskill Topics",
];

export function Pricing({ offer }: { offer: FeaturedOffer }) {
  return (
    <section className={`bg-white bg-grid ${sectionPad}`}>
      <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
            PRICING
          </p>
          <h2 className={`mt-4 text-navy ${displayTitle}`}>
            One course. One payment.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
            A professional training experience at an accessible entry price.
            Specialized Upskill Topics stay separate.
          </p>
        </div>
        <div className="shine-border rounded-[28px] border border-border bg-cream p-8 shadow-[0_24px_60px_rgba(91,109,73,0.08)] sm:p-10">
          <p className="text-sm font-medium text-muted">{offer.course.name}</p>
          <p className="mt-2 font-display text-6xl font-semibold text-navy sm:text-7xl">
            <NumberTicker value={offer.course.price} prefix="₱" />
          </p>
          <p className="mt-1 text-muted">{offer.course.priceLabel}</p>
          <ul className="mt-8 space-y-3">
            {included.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-navy">
                <Check className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <Button variant="accent" size="lg" className="mt-8 w-full" asChild>
            <Link href="/register">Register</Link>
          </Button>
          <p className="mt-4 text-center text-xs text-muted">
            Specialized Upskill Topics are sold separately. No prices shown until
            those courses launch.
          </p>
        </div>
      </Container>
    </section>
  );
}
