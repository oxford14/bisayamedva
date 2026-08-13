import { Container, displayTitle, sectionPad } from "@/components/marketing/container";
import { whyBisaya } from "@/content/site";

export function WhyBisaya() {
  return (
    <section className={`bg-cream bg-grid ${sectionPad}`}>
      <Container>
        <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
          {whyBisaya.eyebrow}
        </p>
        <h2 className={`mt-4 max-w-3xl text-navy ${displayTitle}`}>
          {whyBisaya.title}
        </h2>
        <div className="mt-12 grid gap-px overflow-hidden rounded-[24px] border border-border bg-border md:grid-cols-2">
          {whyBisaya.items.map((item) => (
            <article key={item.title} className="bg-white p-8 lg:p-10">
              <h3 className="text-lg font-semibold text-navy">{item.title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
