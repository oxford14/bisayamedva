"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { practiceCopy } from "@/content/site";
type Props = {
  stepId: string;
  micDenied: boolean;
  isRecordingThisStep: boolean;
  hasRecording: boolean;
  busy: boolean;
  onRecord: () => void;
  onStop: () => void;
  getStepBlob: (stepId: string) => Blob | undefined;
  sectionTitle?: string;
  emptyHint?: string;
  recordLabel?: string;
};

export function MockCallStepRecorderControls({
  stepId,
  micDenied,
  isRecordingThisStep,
  hasRecording,
  busy,
  onRecord,
  onStop,
  getStepBlob,
  sectionTitle = practiceCopy.mockCallYourTurn,
  emptyHint = practiceCopy.mockCallNoRecordingYet,
  recordLabel,
}: Props) {
  const [replaying, setReplaying] = useState(false);

  const onReplay = useCallback(async () => {
    const blob = getStepBlob(stepId);
    if (!blob) return;
    setReplaying(true);
    try {
      const url = URL.createObjectURL(blob);
      await new Promise<void>((resolve, reject) => {
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Playback failed."));
        };
        void audio.play().catch(reject);
      });
    } finally {
      setReplaying(false);
    }
  }, [getStepBlob, stepId]);

  return (
    <div className="rounded-lg border border-border bg-white px-3 py-3 text-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/60">
        {sectionTitle}
      </p>
      {isRecordingThisStep ? (
        <p className="mt-1 text-xs font-medium text-navy" role="status">
          {practiceCopy.mockCallRecordingThisStep}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {isRecordingThisStep ? (
          <Button
            type="button"
            variant="accent"
            size="sm"
            disabled={busy || micDenied}
            onClick={onStop}
          >
            {practiceCopy.mockCallStopRecording}
          </Button>
        ) : (
          <Button
            type="button"
            variant="accent"
            size="sm"
            disabled={busy || micDenied}
            onClick={onRecord}
          >
            {hasRecording
              ? practiceCopy.mockCallRecordAgain
              : (recordLabel ?? practiceCopy.mockCallRecordResponse)}
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy || !hasRecording || isRecordingThisStep || replaying}
          onClick={() => void onReplay()}
        >
          {practiceCopy.mockCallReplayMyResponse}
        </Button>
      </div>
      {!hasRecording && !isRecordingThisStep ? (
        <p className="mt-2 text-xs text-muted">{emptyHint}</p>
      ) : null}
    </div>
  );
}
