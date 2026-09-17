"use client";

import type { ReactNode } from "react";
import { GraduationCap, Headphones, Mic } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { practiceCopy } from "@/content/site";
import { cn } from "@/lib/utils";

type TileProps = {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  delay: number;
  reduceMotion: boolean | null;
};

function HubTile({
  title,
  description,
  icon,
  onClick,
  delay,
  reduceMotion,
}: TileProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : delay, duration: 0.4 }}
      whileHover={reduceMotion ? undefined : { scale: 1.02, y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      className={cn(
        "flex min-h-[180px] flex-col items-start rounded-xl border border-border bg-white p-5 text-left shadow-sm",
        "transition-shadow hover:border-navy/25 hover:shadow-md",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy",
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-lg bg-navy text-white">
        {icon}
      </span>
      <span className="mt-4 font-display text-lg font-semibold text-ink">
        {title}
      </span>
      <span className="mt-2 text-sm leading-snug text-muted">{description}</span>
    </motion.button>
  );
}

export function MockCallHubDashboard({
  onSelectLearn,
  onSelectPractice,
  onSelectAudioSetup,
}: {
  onSelectLearn: () => void;
  onSelectPractice: () => void;
  onSelectAudioSetup: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">
          {practiceCopy.mockCallHubTitle}
        </h2>
        <p className="mt-1 text-sm text-muted">{practiceCopy.mockCallHubSubtitle}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HubTile
          title={practiceCopy.mockCallHubTileLearnTitle}
          description={practiceCopy.mockCallHubTileLearnDesc}
          icon={<GraduationCap className="size-5" aria-hidden />}
          onClick={onSelectLearn}
          delay={0.05}
          reduceMotion={reduceMotion}
        />
        <HubTile
          title={practiceCopy.mockCallHubTilePracticeTitle}
          description={practiceCopy.mockCallHubTilePracticeDesc}
          icon={<Headphones className="size-5" aria-hidden />}
          onClick={onSelectPractice}
          delay={0.12}
          reduceMotion={reduceMotion}
        />
        <HubTile
          title={practiceCopy.mockCallHubTileAudioSetupTitle}
          description={practiceCopy.mockCallHubTileAudioSetupDesc}
          icon={<Mic className="size-5" aria-hidden />}
          onClick={onSelectAudioSetup}
          delay={0.19}
          reduceMotion={reduceMotion}
        />
      </div>
    </div>
  );
}
