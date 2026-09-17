"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MockCallInCallHeader } from "@/components/member/practice/mock-call/mock-call-in-call-header";
import { MockCallPlayCallerControl } from "@/components/member/practice/mock-call/mock-call-play-caller-control";
import { MockCallStepRecorderControls } from "@/components/member/practice/mock-call/mock-call-step-recorder-controls";
import { MockCallToolPanel } from "@/components/member/practice/mock-call/tools/mock-call-tool-panel";
import { MemberCard } from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import { practiceCopy } from "@/content/site";
import {
  CALL_FLOW_STEP_IDS,
  callFlowSteps,
  emptyStepProgress,
  type CallFlowStepId,
} from "@/lib/practice/call-flow";
import { fetchCallerClipBlob } from "@/lib/practice/mock-call-audio-client";
import { dialogueClipKey } from "@/lib/practice/mock-call/audio-keys";
import {
  dialogueRecordingKey,
  getDialoguePages,
  type MockCallDialoguePage,
} from "@/lib/practice/mock-call/dialogue-flow";
import {
  meetsRequiredBooking,
  type MockCallToolState,
} from "@/lib/practice/mock-call/mock-call-tool-state";
import { playAudioBlobWithPrefs } from "@/lib/practice/mock-call/play-audio-blob";
import { getMockCallToolConfigByDialogueKey } from "@/lib/practice/mock-call/tool-config";
import type { MockCallRecordingKey } from "@/lib/practice/mock-call/use-step-recorder";
import { useStepRecorder } from "@/lib/practice/mock-call/use-step-recorder";
import {
  getMockCallCallerLabel,
  type MockCallScenario,
} from "@/lib/practice/mock-call-scenarios";
import type { MockCallSession } from "@/lib/practice/types";
import { cn } from "@/lib/utils";

type Props = {
  scenario: MockCallScenario;
  sessionId: string;
  onSessionSaved: () => void;
  persistSession: (session: MockCallSession) => Promise<MockCallSession>;
  persistAudio: (record: {
    id: string;
    sessionId: string;
    kind: "student" | "caller";
    stepId?: CallFlowStepId;
    dialoguePageId?: string;
    mimeType: string;
    createdAt: string;
    blob: Blob;
  }) => Promise<unknown>;
};

type Phase = "openingSpiel" | "dialogue";

const moodCopyKey: Record<
  MockCallScenario["callerMood"],
  keyof typeof practiceCopy
> = {
  happy: "mockCallMoodHappy",
  neutral: "mockCallMoodNeutral",
  upset: "mockCallMoodUpset",
  worried: "mockCallMoodWorried",
};

export function MockCallDialogueSession({
  scenario,
  sessionId,
  onSessionSaved,
  persistSession,
  persistAudio,
}: Props) {
  const pages = useMemo(
    () => getDialoguePages(scenario.id) ?? [],
    [scenario.id],
  );

  const [phase, setPhase] = useState<Phase>("openingSpiel");
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState(emptyStepProgress);
  const [busy, setBusy] = useState(false);
  const [playingCaller, setPlayingCaller] = useState(false);
  const [ttsHint, setTtsHint] = useState<string | null>(null);
  const [toolState, setToolState] = useState<MockCallToolState | null>(null);

  const [callStartedAt] = useState(() => new Date().toISOString());
  const startedAtRef = useRef(callStartedAt);
  const callerClipIdsRef = useRef<string[]>([]);
  const stepAudioIdsRef = useRef<Partial<Record<string, string>>>({});
  const autoplayKeyRef = useRef<string | null>(null);

  const {
    recordingStepId,
    micDenied,
    startStepRecording,
    stopStepRecording,
    getStepBlob,
    reset: resetStepRecorder,
  } = useStepRecorder();

  const openingStudentLine = useMemo(() => {
    return scenario.lines.find(
      (l) => l.stepId === "opening" && l.speaker === "student",
    )?.text;
  }, [scenario.lines]);

  const openingCoach = useMemo(() => {
    return scenario.lines.find(
      (l) => l.stepId === "opening" && l.speaker === "coach",
    )?.text;
  }, [scenario.lines]);

  const page: MockCallDialoguePage | undefined = pages[dialogueIndex];
  const recordKey: MockCallRecordingKey =
    phase === "openingSpiel"
      ? "opening"
      : page
        ? dialogueRecordingKey(page)
        : "opening";

  const progressStepId: CallFlowStepId =
    phase === "openingSpiel" ? "opening" : (page?.callFlowStepId ?? "opening");

  const stepMeta = callFlowSteps.find((s) => s.id === progressStepId);
  const stepIndexForDots = CALL_FLOW_STEP_IDS.indexOf(progressStepId);

  const persistStepClip = useCallback(
    async (key: MockCallRecordingKey, blob: Blob, stepId?: CallFlowStepId) => {
      const id = crypto.randomUUID();
      await persistAudio({
        id,
        sessionId,
        kind: "student",
        stepId: stepId ?? (typeof key === "string" && key.includes("__") ? key.split("__")[0] as CallFlowStepId : key as CallFlowStepId),
        mimeType: blob.type,
        createdAt: new Date().toISOString(),
        blob,
      });
      stepAudioIdsRef.current = { ...stepAudioIdsRef.current, [String(key)]: id };
    },
    [persistAudio, sessionId],
  );

  const finalizeRecording = useCallback(async () => {
    if (recordingStepId == null) return;
    const result = await stopStepRecording();
    if (result) {
      await persistStepClip(result.stepId, result.blob, progressStepId);
    }
  }, [persistStepClip, progressStepId, recordingStepId, stopStepRecording]);

  const playDialogueCaller = useCallback(async () => {
    if (!page?.callerText) return;
    const clipKey = dialogueClipKey(scenario.id, page.id);
    setBusy(true);
    setTtsHint(null);
    setPlayingCaller(true);
    try {
      const blob = await fetchCallerClipBlob(clipKey);
      if (!blob) {
        setTtsHint(practiceCopy.mockCallAudioMissing);
        return;
      }
      const clipId = crypto.randomUUID();
      await persistAudio({
        id: clipId,
        sessionId,
        kind: "caller",
        stepId: page.callFlowStepId,
        dialoguePageId: page.id,
        mimeType: blob.type || "audio/mpeg",
        createdAt: new Date().toISOString(),
        blob,
      });
      callerClipIdsRef.current = [...callerClipIdsRef.current, clipId];
      await playAudioBlobWithPrefs(blob);
    } catch (err) {
      setTtsHint(
        err instanceof Error ? err.message : practiceCopy.mockCallAudioMissing,
      );
    } finally {
      setPlayingCaller(false);
      setBusy(false);
    }
  }, [page, persistAudio, scenario.id, sessionId]);

  useEffect(() => {
    if (phase !== "dialogue" || !page || page.leadSpeaker !== "caller") return;
    const key = `${page.id}`;
    if (autoplayKeyRef.current === key) return;
    autoplayKeyRef.current = key;
    void playDialogueCaller();
  }, [page, phase, playDialogueCaller]);

  useEffect(() => {
    setToolState(null);
    autoplayKeyRef.current = null;
  }, [dialogueIndex, phase]);

  const bookingOk =
    !page?.requireBooking ||
    (toolState != null && meetsRequiredBooking(toolState, page.requireBooking));

  const onRecordToggle = useCallback(async () => {
    if (recordingStepId === recordKey) {
      setBusy(true);
      try {
        const result = await stopStepRecording();
        if (result) {
          await persistStepClip(result.stepId, result.blob, progressStepId);
        }
      } finally {
        setBusy(false);
      }
    } else {
      await startStepRecording(recordKey);
    }
  }, [
    persistStepClip,
    progressStepId,
    recordKey,
    recordingStepId,
    startStepRecording,
    stopStepRecording,
  ]);

  const endCall = useCallback(async () => {
    setBusy(true);
    try {
      await finalizeRecording();
      const finalProgress = { ...stepProgress };
      for (const id of CALL_FLOW_STEP_IDS) {
        if (finalProgress[id] === "pending") finalProgress[id] = "done";
      }
      await persistSession({
        id: sessionId,
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        startedAt: startedAtRef.current,
        endedAt: new Date().toISOString(),
        stepProgress: finalProgress,
        studentAudioId: null,
        studentStepAudioIds: { ...stepAudioIdsRef.current },
        callerClipIds: callerClipIdsRef.current,
      });
      resetStepRecorder();
      onSessionSaved();
    } finally {
      setBusy(false);
    }
  }, [
    finalizeRecording,
    onSessionSaved,
    persistSession,
    resetStepRecorder,
    scenario.id,
    scenario.title,
    sessionId,
    stepProgress,
  ]);

  const onNext = useCallback(async () => {
    if (!bookingOk) return;
    setBusy(true);
    try {
      await finalizeRecording();
      if (phase === "openingSpiel") {
        setPhase("dialogue");
        setDialogueIndex(0);
        autoplayKeyRef.current = null;
        return;
      }
      if (!page) return;
      setStepProgress((prev) => ({
        ...prev,
        [page.callFlowStepId]: "done",
      }));
      if (dialogueIndex >= pages.length - 1) {
        await endCall();
        return;
      }
      setDialogueIndex((i) => i + 1);
    } finally {
      setBusy(false);
    }
  }, [
    bookingOk,
    dialogueIndex,
    endCall,
    finalizeRecording,
    page,
    pages.length,
    phase,
  ]);

  const onPrevious = useCallback(async () => {
    setBusy(true);
    try {
      await finalizeRecording();
      if (phase === "dialogue" && dialogueIndex > 0) {
        setDialogueIndex((i) => i - 1);
        autoplayKeyRef.current = null;
        return;
      }
      if (phase === "dialogue" && dialogueIndex === 0) {
        setPhase("openingSpiel");
        return;
      }
    } finally {
      setBusy(false);
    }
  }, [dialogueIndex, finalizeRecording, phase]);

  const canGoPrevious = phase === "dialogue" || false;
  const isRecordingThisStep = recordingStepId === recordKey;
  const hasRecording = Boolean(getStepBlob(recordKey));

  const toolConfig = page?.toolKey
    ? getMockCallToolConfigByDialogueKey(page.toolKey)
    : null;

  const renderCallerBlock = () =>
    page?.callerText ? (
      <div className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/60">
          {practiceCopy.mockCallCallerScript}
        </p>
        <p className="mt-1 whitespace-pre-line text-ink">{page.callerText}</p>
        {ttsHint ? (
          <p className="mt-2 text-xs text-muted" role="status">
            {ttsHint}
          </p>
        ) : null}
        <MockCallPlayCallerControl
          isPlaying={playingCaller}
          disabled={busy}
          onPlay={() => void playDialogueCaller()}
        />
      </div>
    ) : null;

  const renderStudentBlock = (text: string) => (
    <div className="rounded-lg border border-teal-bright/40 bg-teal-bright/10 px-3 py-2 text-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/70">
        {phase === "openingSpiel"
          ? practiceCopy.mockCallVaLineLabel
          : practiceCopy.mockCallStudentGuide}
      </p>
      <p className="mt-1 whitespace-pre-line text-ink">{text}</p>
      <p className="mt-2 text-xs text-muted">
        {practiceCopy.mockCallStudentGuideNote}
      </p>
    </div>
  );

  const renderRecorder = () => (
    <MockCallStepRecorderControls
      stepId={String(recordKey)}
      micDenied={micDenied}
      isRecordingThisStep={isRecordingThisStep}
      hasRecording={hasRecording}
      busy={busy}
      onRecord={() => void onRecordToggle()}
      onStop={() => void onRecordToggle()}
      getStepBlob={(k) => getStepBlob(k as MockCallRecordingKey)}
      sectionTitle={
        phase === "openingSpiel"
          ? practiceCopy.mockCallSayLineRecordHeading
          : practiceCopy.mockCallYourTurn
      }
      emptyHint={
        phase === "openingSpiel"
          ? practiceCopy.mockCallSayLineNoRecordingYet
          : practiceCopy.mockCallNoRecordingYet
      }
      recordLabel={
        phase === "openingSpiel"
          ? practiceCopy.mockCallRecordOpeningSpiel
          : practiceCopy.mockCallRecordResponse
      }
    />
  );

  const callerLabel = getMockCallCallerLabel(
    scenario,
    practiceCopy.mockCallGenericCallerName,
  );
  const moodLabel = practiceCopy[moodCopyKey[scenario.callerMood]];

  return (
    <MemberCard className="space-y-4 p-4">
      <MockCallInCallHeader
        callerName={callerLabel}
        moodLabel={moodLabel}
        startedAt={callStartedAt}
        disabled={busy}
        onEndCall={() => void endCall()}
      />
      <div>
        <p className="font-display text-lg font-semibold text-ink">
          {scenario.title}
        </p>
        {stepMeta ? (
          <p className="text-sm text-muted">
            {practiceCopy.mockCallStepLabel}{" "}
            {stepMeta.order} — {practiceCopy[stepMeta.titleKey]}
          </p>
        ) : null}
        {phase === "dialogue" && page ? (
          <p className="text-xs text-muted">
            {practiceCopy.mockCallDialoguePageLabel}{" "}
            {dialogueIndex + 1} / {pages.length}
          </p>
        ) : null}
        <div className="mt-2 flex gap-1">
          {CALL_FLOW_STEP_IDS.map((id, i) => (
            <span
              key={id}
              className={cn(
                "size-2 rounded-full",
                i <= stepIndexForDots ? "bg-navy" : "bg-border",
              )}
              aria-hidden
            />
          ))}
        </div>
      </div>

      {phase === "openingSpiel" ? (
        <>
          {openingCoach ? (
            <div className="rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/60">
                {practiceCopy.mockCallCoachHint}
              </p>
              <p className="mt-1 text-ink">{openingCoach}</p>
            </div>
          ) : null}
          {openingStudentLine
            ? renderStudentBlock(openingStudentLine)
            : null}
          {renderRecorder()}
        </>
      ) : page ? (
        <>
          {page.coachHint ? (
            <div className="rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/60">
                {practiceCopy.mockCallCoachHint}
              </p>
              <p className="mt-1 text-ink">{page.coachHint}</p>
            </div>
          ) : null}

          {page.requireBooking && toolConfig ? (
            <MockCallToolPanel
              key={`${page.id}-${page.toolKey}`}
              config={toolConfig}
              onToolStateChange={setToolState}
            />
          ) : null}

          {page.leadSpeaker === "caller" ? (
            <>
              {renderCallerBlock()}
              {page.studentText ? renderStudentBlock(page.studentText) : null}
              {renderRecorder()}
              {!page.requireBooking && toolConfig ? (
                <MockCallToolPanel
                  key={`${page.id}-${page.toolKey}`}
                  config={toolConfig}
                  onToolStateChange={setToolState}
                />
              ) : null}
            </>
          ) : (
            <>
              {page.studentText ? renderStudentBlock(page.studentText) : null}
              {renderRecorder()}
              {renderCallerBlock()}
              {!page.requireBooking && toolConfig ? (
                <MockCallToolPanel
                  key={`${page.id}-${page.toolKey}`}
                  config={toolConfig}
                  onToolStateChange={setToolState}
                />
              ) : null}
            </>
          )}

          {!bookingOk && page.requireBooking ? (
            <p className="text-xs text-amber-800" role="status">
              {practiceCopy.mockCallBookTenBeforeNext}
            </p>
          ) : null}
        </>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy || !canGoPrevious}
          onClick={() => void onPrevious()}
        >
          {practiceCopy.mockCallPreviousStep}
        </Button>
        <Button
          type="button"
          variant="accent"
          disabled={busy || !bookingOk}
          onClick={() => void onNext()}
        >
          {phase === "openingSpiel"
            ? practiceCopy.mockCallContinueToDialogue
            : dialogueIndex >= pages.length - 1
              ? practiceCopy.mockCallEndCall
              : practiceCopy.mockCallNextStep}
        </Button>
      </div>
    </MemberCard>
  );
}
