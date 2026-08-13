import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";
import { finalCta, images, site } from "@/content/site";
import { formatPeso } from "@/lib/utils";

export function FinalCta() {
  return (
    <section className="relative min-h-[28rem] w-full overflow-hidden bg-navy text-cream">
      <Image
        src={images.cta.src}
        alt={images.cta.alt}
        fill
        sizes="100vw"
        className="object-cover object-[70%_center]"
      />
      <div className="absolute inset-0 bg-linear-to-r from-navy via-navy/86 to-navy/35" />
      <Container className="relative z-10 flex min-h-[28rem] items-center py-20 lg:min-h-[32rem]">
        <div className="max-w-2xl">
          <h2 className="font-display text-[clamp(2.4rem,5.5vw,4.75rem)] leading-[0.98] font-semibold tracking-tight">
            {finalCta.title}
          </h2>
          <p className="mt-5 max-w-lg text-lg text-cream/78">{finalCta.body}</p>
          <Button variant="accent" size="lg" className="mt-8" asChild>
            <Link href={finalCta.cta.href}>
              {finalCta.cta.label} — {formatPeso(site.featuredCourse.price)}
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
