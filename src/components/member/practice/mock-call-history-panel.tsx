"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MemberCard } from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import { practiceCopy } from "@/content/site";
import { CALL_FLOW_STEP_IDS } from "@/lib/practice/call-flow";
import { fetchCallerClipBlob } from "@/lib/practice/mock-call-audio-client";
import {
  buildConversationPlaybackQueue,
  canPlayFullConversation,
  studentRecordingCount,
} from "@/lib/practice/mock-call/conversation-playback";
import { applyAudioOutputDevice, getMockCallAudioDevicePrefs } from "@/lib/practice/mock-call/audio-device-prefs";
import { usesDialogueFlow } from "@/lib/practice/mock-call/dialogue-flow";
import {
  conversationDownloadFilename,
  mergeConversationBlobs,
  type MergeConversationProgress,
  triggerBlobDownload,
} from "@/lib/practice/mock-call/merge-conversation-audio";
import type { MockCallAudioRecord, MockCallSession } from "@/lib/practice/types";
import { cn } from "@/lib/utils";

type Props = {
  sessions: MockCallSession[];
  loading: boolean;
  onDelete: (sessionId: string) => Promise<void>;
  onLoadAudio: (sessionId: string) => Promise<MockCallAudioRecord[]>;
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

type PlaybackHandle = {
  playBlob: (blob: Blob) => Promise<void>;
  stop: () => void;
  isStopped: () => boolean;
};

function createPlaybackHandle(): PlaybackHandle {
  let aborted = false;
  let activeAudio: HTMLAudioElement | null = null;
  let activeUrl: string | null = null;

  const clearActive = () => {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.onended = null;
      activeAudio.onerror = null;
      activeAudio.src = "";
      activeAudio = null;
    }
    if (activeUrl) {
      URL.revokeObjectURL(activeUrl);
      activeUrl = null;
    }
  };

  return {
    stop: () => {
      aborted = true;
      clearActive();
    },
    isStopped: () => aborted,
    playBlob: async (blob: Blob) => {
      if (aborted) return;
      activeUrl = URL.createObjectURL(blob);
      const url = activeUrl;
      await new Promise<void>((resolve, reject) => {
        if (aborted) {
          URL.revokeObjectURL(url);
          activeUrl = null;
          resolve();
          return;
        }
        const audio = new Audio(url);
        activeAudio = audio;
        const finish = () => {
          if (activeUrl === url) {
            URL.revokeObjectURL(url);
            activeUrl = null;
          }
          if (activeAudio === audio) activeAudio = null;
        };
        audio.onended = () => {
          finish();
          resolve();
        };
        audio.onerror = () => {
          finish();
          if (aborted) resolve();
          else reject(new Error("Playback failed."));
        };
        const startPlay = () => {
          if (aborted) {
            finish();
            resolve();
            return;
          }
          void audio.play().catch((err) => {
            finish();
            if (aborted) resolve();
            else reject(err);
          });
        };
        const { speakerDeviceId } = getMockCallAudioDevicePrefs();
        void applyAudioOutputDevice(
          audio,
          speakerDeviceId || undefined,
        ).finally(startPlay);
      });
    },
  };
}

export function MockCallHistoryPanel({
  sessions,
  loading,
  onDelete,
  onLoadAudio,
}: Props) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadPhaseLabel, setDownloadPhaseLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const playbackRef = useRef<PlaybackHandle | null>(null);

  const stopPlayback = useCallback(() => {
    playbackRef.current?.stop();
    playbackRef.current = null;
    setPlayingId(null);
  }, []);

  useEffect(() => {
    return () => {
      playbackRef.current?.stop();
      playbackRef.current = null;
    };
  }, []);

  const runPlayback = useCallback(
    async (
      sessionId: string,
      sequence: (playBlob: (blob: Blob) => Promise<void>) => Promise<void>,
    ) => {
      stopPlayback();
      const handle = createPlaybackHandle();
      playbackRef.current = handle;
      setPlayingId(sessionId);
      setError(null);
      try {
        await sequence(handle.playBlob.bind(handle));
        if (!handle.isStopped()) {
          setError(null);
        }
      } catch (err) {
        if (!handle.isStopped()) {
          setError(err instanceof Error ? err.message : "Playback failed.");
        }
      } finally {
        if (playbackRef.current === handle) {
          playbackRef.current = null;
        }
        setPlayingId((id) => (id === sessionId ? null : id));
      }
    },
    [stopPlayback],
  );

  const playFullConversation = useCallback(
    async (session: MockCallSession) => {
      if (!canPlayFullConversation(session)) return;
      await runPlayback(session.id, async (playBlob) => {
        const clips = await onLoadAudio(session.id);
        const queue = buildConversationPlaybackQueue(session, clips, {
          fetchBundledCaller: fetchCallerClipBlob,
        });
        if (queue.length === 0) {
          setError(practiceCopy.mockCallReplayNothing);
          return;
        }
        let played = 0;
        for (const segment of queue) {
          const blob = await segment.getBlob();
          if (!blob) continue;
          await playBlob(blob);
          played += 1;
        }
        if (played === 0) {
          setError(practiceCopy.mockCallReplayNothing);
        }
      });
    },
    [onLoadAudio, runPlayback],
  );

  const mapMergeProgressToPercent = useCallback(
    (p: MergeConversationProgress): number => {
      if (p.phase === "decode") {
        return 50 + Math.round((p.current / Math.max(p.total, 1)) * 25);
      }
      if (p.phase === "merge") return 78;
      if (p.phase === "encode") return p.current >= 1 ? 90 : 84;
      return 50;
    },
    [],
  );

  const downloadConversation = useCallback(
    async (session: MockCallSession) => {
      if (!canPlayFullConversation(session) || downloadingId) return;
      setDownloadingId(session.id);
      setDownloadProgress(0);
      setDownloadPhaseLabel(practiceCopy.mockCallDownloadPhaseFetching);
      setError(null);
      try {
        const clips = await onLoadAudio(session.id);
        const queue = buildConversationPlaybackQueue(session, clips, {
          fetchBundledCaller: fetchCallerClipBlob,
        });
        const blobs: Blob[] = [];
        const segmentTotal = Math.max(queue.length, 1);
        let segmentIndex = 0;
        for (const segment of queue) {
          const blob = await segment.getBlob();
          if (blob) blobs.push(blob);
          segmentIndex += 1;
          setDownloadProgress(
            Math.round((segmentIndex / segmentTotal) * 50),
          );
        }
        if (blobs.length === 0) {
          setError(practiceCopy.mockCallDownloadNothing);
          return;
        }
        setDownloadPhaseLabel(practiceCopy.mockCallDownloadPhaseMerging);
        const merged = await mergeConversationBlobs(blobs, (p) => {
          setDownloadProgress(mapMergeProgressToPercent(p));
        });
        if (!merged) {
          setError(practiceCopy.mockCallDownloadMergeFailed);
          return;
        }
        setDownloadPhaseLabel(practiceCopy.mockCallDownloadPhaseSaving);
        setDownloadProgress(95);
        triggerBlobDownload(
          merged,
          conversationDownloadFilename(
            session.scenarioId,
            session.startedAt,
            merged,
          ),
        );
        setDownloadProgress(100);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : practiceCopy.mockCallDownloadMergeFailed,
        );
      } finally {
        setDownloadingId(null);
        setDownloadProgress(0);
        setDownloadPhaseLabel("");
      }
    },
    [downloadingId, mapMergeProgressToPercent, onLoadAudio],
  );

  if (loading) {
    return <p className="text-sm text-muted">Loading history…</p>;
  }

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted">{practiceCopy.mockCallHistoryEmpty}</p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="space-y-3">
        {sessions.map((session) => {
          const doneCount = CALL_FLOW_STEP_IDS.filter(
            (id) => session.stepProgress[id] === "done",
          ).length;
          const recordedCount = studentRecordingCount(session);
          const isDialogue = usesDialogueFlow(session.scenarioId);
          const isPlaying = playingId === session.id;
          const isDownloading = downloadingId === session.id;
          const busyRow = isPlaying || isDownloading;
          return (
            <li key={session.id}>
              <MemberCard className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-display font-semibold text-ink">
                      {session.scenarioTitle}
                    </p>
                    <p className="text-xs text-muted">
                      {formatWhen(session.startedAt)}
                      {session.endedAt ? " · completed" : " · in progress"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Steps done: {doneCount}/{CALL_FLOW_STEP_IDS.length}
                    </p>
                    {recordedCount > 0 ? (
                      <p className="text-xs text-muted">
                        {practiceCopy.mockCallStepsRecordedLabel}: {recordedCount}
                        {isDialogue ? "" : `/${CALL_FLOW_STEP_IDS.length}`}
                      </p>
                    ) : session.studentAudioId ? (
                      <p className="text-xs text-muted">
                        {practiceCopy.mockCallLegacyWholeCallRecording}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isPlaying ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={stopPlayback}
                      >
                        {practiceCopy.mockCallStopPlayback}
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={!canPlayFullConversation(session) || isDownloading}
                          title={practiceCopy.mockCallReplayFullConversationHint}
                          onClick={() => void playFullConversation(session)}
                        >
                          {practiceCopy.mockCallReplayFullConversation}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={
                            !canPlayFullConversation(session) || busyRow
                          }
                          onClick={() => void downloadConversation(session)}
                        >
                          {isDownloading
                            ? practiceCopy.mockCallDownloadingConversation
                            : practiceCopy.mockCallDownloadConversation}
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn("text-destructive")}
                      disabled={busyRow}
                      onClick={() => {
                        if (!window.confirm(practiceCopy.mockCallDeleteConfirm)) {
                          return;
                        }
                        void onDelete(session.id);
                      }}
                    >
                      {practiceCopy.mockCallDeleteSession}
                    </Button>
                  </div>
                </div>
                {isDownloading ? (
                  <div className="mt-3 space-y-1.5">
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-border"
                      role="progressbar"
                      aria-valuenow={downloadProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={practiceCopy.mockCallDownloadingConversation}
                    >
                      <div
                        className="h-full rounded-full bg-navy transition-[width] duration-200 ease-out"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted">
                      {practiceCopy.mockCallDownloadProgressLabel
                        .replace("{percent}", String(downloadProgress))
                        .replace("{phase}", downloadPhaseLabel)}
                    </p>
                  </div>
                ) : null}
              </MemberCard>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
