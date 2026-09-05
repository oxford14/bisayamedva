import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Container,
  displayTitle,
  sectionPad,
} from "@/components/marketing/container";
import { trainer } from "@/content/site";

export function MeetTrainer() {
  return (
    <section
      id="meet-trainer"
      className={`scroll-mt-24 bg-white ${sectionPad}`}
    >
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
          <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[1.75rem] border border-navy/10 bg-sand shadow-[0_24px_60px_rgba(47,56,38,0.12)] lg:mx-0 lg:max-w-none">
            <Image
              src={trainer.image.src}
              alt={trainer.image.alt}
              fill
              sizes="(max-width: 1024px) 90vw, 42vw"
              className="object-cover object-top"
              priority={false}
            />
          </div>

          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
              {trainer.eyebrow}
            </p>
            <h2 className={`mt-4 max-w-2xl text-navy ${displayTitle}`}>
              {trainer.title}
            </h2>

            <div className="mt-6">
              <p className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                {trainer.name}
              </p>
              <p className="mt-1 text-sm font-medium text-navy/70">
                {trainer.role}
              </p>
              <p className="mt-2 text-sm font-semibold tracking-wide text-teal uppercase">
                {trainer.yearsLabel}
              </p>
            </div>

            <p className="mt-6 text-lg font-medium text-navy">
              {trainer.greeting}
            </p>
            <div className="mt-3 space-y-4 text-base leading-relaxed text-muted">
              {trainer.body.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
              <p>{trainer.closing}</p>
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {trainer.philosophy.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-border/80 bg-cream/70 px-4 py-3"
                >
                  <p className="text-sm font-semibold tracking-wide text-navy uppercase">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>

            <Button variant="accent" size="lg" className="mt-8" asChild>
              <Link href={trainer.cta.href}>{trainer.cta.label}</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
