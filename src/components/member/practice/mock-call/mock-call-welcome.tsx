"use client";

import { BookOpen, Mic, Phone } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { MemberCard } from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import { practiceCopy } from "@/content/site";

const bullets = [
  { key: "mockCallWelcomeBullet1" as const, icon: BookOpen },
  { key: "mockCallWelcomeBullet2" as const, icon: Phone },
  { key: "mockCallWelcomeBullet3" as const, icon: Mic },
];

export function MockCallWelcome({ onContinue }: { onContinue: () => void }) {
  const reduceMotion = useReducedMotion();

  return (
    <MemberCard className="relative overflow-hidden p-6 sm:p-8">
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-teal-bright/15"
        aria-hidden
      />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.45 }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/60">
          Practice Lab
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">
          {practiceCopy.mockCallWelcomeTitle}
        </h2>
        <p className="mt-3 max-w-xl text-sm text-muted">
          {practiceCopy.mockCallWelcomeLead}
        </p>
      </motion.div>

      <ul className="mt-6 space-y-3">
        {bullets.map(({ key, icon: Icon }, i) => (
          <motion.li
            key={key}
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: reduceMotion ? 0 : 0.12 + i * 0.08,
              duration: reduceMotion ? 0 : 0.35,
            }}
            className="flex gap-3 rounded-lg border border-border/80 bg-surface/50 px-3 py-2.5"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-bright/25 text-navy">
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="text-sm text-ink">{practiceCopy[key]}</span>
          </motion.li>
        ))}
      </ul>

      <motion.div
        className="mt-8"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduceMotion ? 0 : 0.45 }}
      >
        <Button type="button" variant="accent" size="lg" onClick={onContinue}>
          {practiceCopy.mockCallWelcomeContinue}
        </Button>
      </motion.div>
    </MemberCard>
  );
}
