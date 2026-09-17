"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const BAR_DELAYS = [0, 0.15, 0.08, 0.22];

type Props = {
  active: boolean;
  className?: string;
};

export function MockCallCallerSpeakingIndicator({ active, className }: Props) {
  const reduceMotion = useReducedMotion();

  if (!active) return null;

  return (
    <div
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center",
        className,
      )}
      aria-hidden
    >
      {!reduceMotion ? (
        <motion.span
          className="absolute inset-0 rounded-full bg-teal-bright/20"
          animate={{ scale: [1, 1.45, 1], opacity: [0.45, 0, 0.45] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
      <div className="relative flex h-6 items-end justify-center gap-0.5">
        {BAR_DELAYS.map((delay, i) =>
          reduceMotion ? (
            <span
              key={i}
              className="inline-block w-1 rounded-full bg-navy"
              style={{ height: 12 }}
            />
          ) : (
            <motion.span
              key={i}
              className="inline-block w-1 origin-bottom rounded-full bg-navy"
              animate={{ height: [6, 18, 8, 16, 6] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
              }}
              style={{ height: 10 }}
            />
          ),
        )}
      </div>
    </div>
  );
}
