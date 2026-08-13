import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Container } from "@/components/marketing/container";
import { hero, site } from "@/content/site";
import { formatPeso } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] w-full overflow-hidden bg-navy text-cream">
      <Image
        src={hero.image.src}
        alt={hero.image.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-[72%_center] lg:object-[78%_18%]"
      />
      <div className="absolute inset-0 bg-linear-to-r from-navy via-navy/88 to-navy/25 max-lg:from-navy/92 max-lg:via-navy/70 max-lg:to-navy/35" />
      <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-40" />

      <Container className="relative z-10 flex min-h-[100svh] flex-col justify-end pb-16 pt-28 sm:justify-center sm:pb-24 sm:pt-24 lg:pb-28">
        <div className="max-w-2xl xl:max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.24em] text-teal-bright uppercase">
            {hero.eyebrow}
          </p>
          <h1 className="mt-5 font-display text-[clamp(2.35rem,6.4vw,5.4rem)] leading-[0.98] font-semibold tracking-tight text-balance">
            {hero.headline}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-cream/82 sm:text-lg">
            {hero.support}
          </p>
          <div className="mt-8 flex flex-wrap items-end gap-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-cream/50 uppercase">
                {site.featuredCourse.priceLabel}
              </p>
              <p className="font-display text-5xl font-semibold sm:text-6xl">
                <NumberTicker value={site.featuredCourse.price} prefix="₱" />
              </p>
            </div>
            <p className="max-w-[14rem] text-sm text-cream/70">
              {site.featuredCourse.name} · {site.nextSession.format} · Every
              weekend
            </p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button variant="accent" size="lg" asChild>
              <Link href={hero.primaryCta.href}>
                {hero.primaryCta.label} — {formatPeso(site.featuredCourse.price)}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="border-cream/25 text-cream hover:bg-white/10"
              asChild
            >
              <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
