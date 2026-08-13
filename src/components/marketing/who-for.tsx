import Image from "next/image";
import { Container, displayTitle, sectionPad } from "@/components/marketing/container";
import { audiences } from "@/content/site";

export function WhoFor() {
  return (
    <section className={`bg-cream ${sectionPad}`}>
      <Container>
        <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
          WHO THIS IS FOR
        </p>
        <h2 className={`mt-4 max-w-3xl text-navy ${displayTitle}`}>
          Kung aspiring Medical VA ka, or ready ka mo-shift, start here.
        </h2>
      </Container>
      <div className="mt-12 grid w-full gap-1 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0">
        {audiences.map((audience) => (
          <article key={audience.id} className="group relative min-h-[420px] overflow-hidden">
            <Image
              src={audience.image}
              alt={audience.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
              className="object-cover object-top motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-linear-to-t from-navy via-navy/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 lg:p-7">
              <h3 className="font-display text-2xl font-semibold text-cream">
                {audience.title}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-cream/80">
                {audience.body}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
