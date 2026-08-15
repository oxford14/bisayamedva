"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";
import { hero } from "@/content/site";
import type { FeaturedOffer } from "@/lib/content/featured-offer";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ session }: { session: FeaturedOffer["session"] }) {
  const reduceMotion = useReducedMotion();

  const fadeUp = (delay = 0) =>
    reduceMotion
      ? { initial: false, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease },
        };

  return (
    <section className="relative isolate overflow-hidden bg-white text-ink">
      <Container className="relative grid min-h-[calc(100svh-4.5rem)] items-center gap-10 py-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)_10.5rem] lg:gap-8 lg:py-14 xl:gap-12">
        <div className="relative z-10 max-w-xl xl:max-w-2xl">
          <motion.p
            className="text-[11px] font-semibold tracking-[0.22em] text-navy/55 uppercase"
            {...fadeUp(0.05)}
          >
            {hero.eyebrow}
          </motion.p>
          <motion.h1
            className="mt-5 font-display text-[clamp(2.4rem,5.6vw,4.75rem)] leading-[1.02] font-semibold tracking-tight text-balance text-ink"
            {...fadeUp(0.12)}
          >
            {hero.headline}
          </motion.h1>
          <motion.p
            className="mt-6 max-w-md text-base leading-relaxed text-muted sm:text-lg"
            {...fadeUp(0.2)}
          >
            {hero.support}
          </motion.p>
          <motion.div
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
            {...fadeUp(0.28)}
          >
            <Button
              variant="accent"
              size="lg"
              className="rounded-md shadow-none"
              asChild
            >
              <Link href={hero.primaryCta.href}>
                {hero.primaryCta.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="rounded-md border-teal-bright/70 text-navy hover:bg-teal-bright/10"
              asChild
            >
              <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          className="relative mx-auto aspect-[1331/992] w-full max-w-sm sm:max-w-md lg:mx-0 lg:max-w-none"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease }}
        >
          {/* Backdrop shape, sits behind her */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-[2%] right-[4%] z-0 size-[58%]"
          >
            <Image
              src="/images/hero/geo-circle.svg"
              alt=""
              fill
              className="animate-float-slow object-contain opacity-90"
              unoptimized
            />
          </div>

          {/* Transparent portrait; framing trims only the empty left padding */}
          <Image
            src={hero.image.src}
            alt={hero.image.alt}
            fill
            priority
            sizes="(max-width: 1024px) 90vw, 46vw"
            className="z-10 object-cover object-right"
          />

          {/* Foreground accents, layered over her */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-[2%] -left-[14%] z-20 size-[46%]"
          >
            <Image
              src="/images/hero/geo-arc.svg"
              alt=""
              fill
              className="animate-spin-slower object-contain opacity-75"
              unoptimized
            />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute top-[2%] right-0 z-20 size-4 sm:size-5"
          >
            <Image
              src="/images/hero/geo-dot.svg"
              alt=""
              fill
              className="animate-pulse-soft object-contain"
              unoptimized
            />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute top-[22%] -left-[18%] z-20 hidden w-16 opacity-70 sm:block lg:w-20"
          >
            <Image
              src="/images/hero/geo-dot-grid.svg"
              alt=""
              width={144}
              height={192}
              className="h-auto w-full animate-float-slower"
              unoptimized
            />
          </div>
        </motion.div>

        <motion.aside
          className="relative z-10 border-t border-navy/10 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.35, ease }}
          aria-label="Next weekend training"
        >
          <p className="text-[10px] font-semibold tracking-[0.2em] text-navy/45 uppercase">
            {session.label}
          </p>
          <p className="mt-4 font-display text-2xl leading-tight font-semibold text-ink lg:text-[1.65rem]">
            {session.day}
          </p>
          <p className="mt-2 text-sm text-muted">{session.dateLabel}</p>
          <p className="mt-1 text-sm font-medium text-navy">
            {session.startTime} – {session.endTime}{" "}
            <span className="text-muted font-normal">
              {session.timezoneLabel}
            </span>
          </p>
          <p className="mt-4 text-xs tracking-wide text-muted uppercase">
            {session.format}
          </p>
          <Link
            href="/register"
            className="mt-5 inline-flex text-sm font-semibold text-navy underline decoration-teal-bright decoration-2 underline-offset-4 transition-colors hover:text-navy-deep cursor-pointer"
          >
            Register
          </Link>
        </motion.aside>
      </Container>
    </section>
  );
}
