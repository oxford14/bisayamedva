import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, displayTitle, sectionPad } from "@/components/marketing/container";
import { platformFeatures } from "@/content/site";

export function PlatformFeatures() {
  return (
    <section
      id="platform-features"
      className={`scroll-mt-24 bg-cream bg-grid ${sectionPad}`}
    >
      <Container>
        <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
          {platformFeatures.eyebrow}
        </p>
        <h2 className={`mt-4 max-w-3xl text-navy ${displayTitle}`}>
          {platformFeatures.title}
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          {platformFeatures.intro}
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-8">
          {platformFeatures.items.map((item) => (
            <article key={item.id} className="flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-navy/10 bg-white shadow-[0_24px_60px_rgba(91,109,73,0.12)]">
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover object-center"
                />
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold text-navy">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              <ul className="mt-4 space-y-2">
                {item.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2 text-sm text-muted">
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-teal"
                      aria-hidden
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start gap-4 border-t border-navy/10 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">{platformFeatures.enrollmentNote}</p>
          <Button variant="accent" asChild>
            <Link href={platformFeatures.cta.href}>{platformFeatures.cta.label}</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
