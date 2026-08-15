import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { Container, displayTitle, sectionPad } from "@/components/marketing/container";
import { hero, whyBilling } from "@/content/site";

export function WhyBilling() {
  return (
    <section id="medical-billing" className={`scroll-mt-24 bg-cream bg-grid ${sectionPad}`}>
      <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
            {whyBilling.eyebrow}
          </p>
          <h2 className={`mt-4 text-navy ${displayTitle}`}>{whyBilling.title}</h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            {whyBilling.body}
          </p>
          <ul className="mt-10 space-y-5">
            {whyBilling.points.map((point) => (
              <li key={point.title} className="flex gap-3">
                <CheckCircle2
                  className="mt-0.5 size-5 shrink-0 text-teal"
                  aria-hidden
                />
                <div>
                  <p className="font-semibold text-navy">{point.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {point.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] shadow-[0_30px_80px_rgba(91,109,73,0.16)]">
            <Image
              src={hero.portrait.src}
              alt={hero.portrait.alt}
              fill
              sizes="(max-width: 1024px) 90vw, 40vw"
              className="object-cover object-top"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
