import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";
import { images, site } from "@/content/site";
import { formatPeso } from "@/lib/utils";

export function WeekendTraining() {
  const session = site.nextSession;

  return (
    <section className="relative min-h-[32rem] w-full overflow-hidden bg-navy text-cream lg:min-h-[36rem]">
      <Image
        src={images.weekend.src}
        alt={images.weekend.alt}
        fill
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-linear-to-r from-navy via-navy/88 to-navy/30 max-md:from-navy/92 max-md:via-navy/78" />
      <Container className="relative z-10 flex min-h-[32rem] items-center py-20 lg:min-h-[36rem]">
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-teal-bright uppercase">
            {session.label}
          </p>
          <h2 className="mt-4 font-display text-[clamp(2.4rem,5vw,4.5rem)] leading-[0.95] font-semibold">
            {session.day}
          </h2>
          <p className="mt-2 text-lg text-cream/70">{session.dateLabel}</p>
          <dl className="mt-8 space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Clock className="size-4 text-teal-bright" aria-hidden />
              <dt className="sr-only">Time</dt>
              <dd>
                {session.startTime} – {session.endTime} {session.timezoneLabel}
              </dd>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="size-4 text-teal-bright" aria-hidden />
              <dt className="sr-only">Format</dt>
              <dd>{session.format}</dd>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="size-4 text-teal-bright" aria-hidden />
              <dt className="sr-only">Course</dt>
              <dd>{site.featuredCourse.name}</dd>
            </div>
          </dl>
          <p className="mt-8 font-display text-5xl font-semibold">
            {formatPeso(site.featuredCourse.price)}
          </p>
          <Button variant="accent" size="lg" className="mt-7" asChild>
            <Link href="/register">Reserve Your Slot</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
