"use client";

import { Play } from "lucide-react";
import { MockCallCallerSpeakingIndicator } from "@/components/member/practice/mock-call/mock-call-caller-speaking-indicator";
import { Button } from "@/components/ui/button";
import { practiceCopy } from "@/content/site";
import { cn } from "@/lib/utils";

type Props = {
  isPlaying: boolean;
  disabled?: boolean;
  onPlay: () => void;
  className?: string;
};

export function MockCallPlayCallerControl({
  isPlaying,
  disabled,
  onPlay,
  className,
}: Props) {
  if (isPlaying) {
    return (
      <div
        className={cn(
          "mt-3 flex items-center gap-3 rounded-lg border border-navy/20 bg-navy/5 px-3 py-2.5",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <MockCallCallerSpeakingIndicator active />
        <p className="text-sm font-medium text-navy">
          {practiceCopy.mockCallCallerPlaying}
        </p>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className={cn(
        "mt-3 gap-1.5 border-navy/25 text-navy hover:bg-surface",
        className,
      )}
      disabled={disabled}
      onClick={onPlay}
    >
      <Play className="size-3.5 shrink-0" aria-hidden />
      {practiceCopy.mockCallPlayCaller}
    </Button>
  );
}
