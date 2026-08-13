import { Container, displayTitle, sectionPad } from "@/components/marketing/container";
import { howItWorks, site } from "@/content/site";
import { formatPeso } from "@/lib/utils";

export function HowItWorks() {
  return (
    <section id="how-it-works" className={`scroll-mt-24 bg-white ${sectionPad}`}>
      <Container>
        <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
          {howItWorks.eyebrow}
        </p>
        <h2 className={`mt-4 text-navy ${displayTitle}`}>{howItWorks.title}</h2>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-[24px] border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.steps.map((step) => (
            <li key={step.n} className="bg-cream/80 p-8 lg:p-10">
              <p className="font-display text-4xl text-teal">{step.n}</p>
              <h3 className="mt-5 text-lg font-semibold text-navy">
                {step.title === "Pay"
                  ? `Pay ${formatPeso(site.featuredCourse.price)}`
                  : step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
