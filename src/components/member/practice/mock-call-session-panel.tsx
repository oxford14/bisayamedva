"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MockCallDialogueSession } from "@/components/member/practice/mock-call/mock-call-dialogue-session";
import { MockCallInCallHeader } from "@/components/member/practice/mock-call/mock-call-in-call-header";
import { MockCallPlayCallerControl } from "@/components/member/practice/mock-call/mock-call-play-caller-control";
import { MockCallIncomingCall } from "@/components/member/practice/mock-call/mock-call-incoming-call";
import { usesDialogueFlow } from "@/lib/practice/mock-call/dialogue-flow";
import { MockCallStepRecorderControls } from "@/components/member/practice/mock-call/mock-call-step-recorder-controls";
import { MockCallToolPanel } from "@/components/member/practice/mock-call/tools/mock-call-tool-panel";
import { MemberCard } from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { practiceCopy } from "@/content/site";
import {
  CALL_FLOW_STEP_IDS,
  callFlowSteps,
  emptyStepProgress,
  type CallFlowStepId,
} from "@/lib/practice/call-flow";
import { fetchCallerClipBlob } from "@/lib/practice/mock-call-audio-client";
import { callerClipsForStep } from "@/lib/practice/mock-call/audio-keys";
import { playAudioBlobWithPrefs } from "@/lib/practice/mock-call/play-audio-blob";
import { primeIncomingCallAudio } from "@/lib/practice/mock-call/use-incoming-call-ring";
import {
  useStepRecorder,
  type MockCallRecordingKey,
} from "@/lib/practice/mock-call/use-step-recorder";
import {
  getMockCallCallerLabel,
  getMockCallToolConfig,
  linesForStep,
  mockCallScenarios,
  type MockCallScenario,
} from "@/lib/practice/mock-call-scenarios";
import {
  canAccessAllMockCallScenarios,
  isMockCallScenarioAllowed,
  MOCK_CALL_STUDENT_SCENARIO_ID,
} from "@/lib/member/practice-access";
import type { MockCallSession } from "@/lib/practice/types";
import { cn } from "@/lib/utils";

type Props = {
  userRole: string;
  onSessionSaved: () => void;
  persistSession: (session: MockCallSession) => Promise<MockCallSession>;
  persistAudio: (record: {
    id: string;
    sessionId: string;
    kind: "student" | "caller";
    stepId?: CallFlowStepId;
    mimeType: string;
    createdAt: string;
    blob: Blob;
  }) => Promise<unknown>;
};

type CallUi = "idle" | "ringing" | "connected";
type StepBeat = "sayGuide" | "callerAndRespond";

const moodLabel: Record<
  MockCallScenario["callerMood"],
  keyof typeof practiceCopy
> = {
  happy: "mockCallMoodHappy",
  neutral: "mockCallMoodNeutral",
  upset: "mockCallMoodUpset",
  worried: "mockCallMoodWorried",
};

function newSessionId() {
  return crypto.randomUUID();
}

function initialScenarioId(userRole: string) {
  const preferred = mockCallScenarios[0]?.id ?? MOCK_CALL_STUDENT_SCENARIO_ID;
  if (isMockCallScenarioAllowed(preferred, userRole)) return preferred;
  return MOCK_CALL_STUDENT_SCENARIO_ID;
}

export function MockCallSessionPanel({
  userRole,
  onSessionSaved,
  persistSession,
  persistAudio,
}: Props) {
  const [scenarioId, setScenarioId] = useState(() => initialScenarioId(userRole));
  const [active, setActive] = useState(false);
  const [callUi, setCallUi] = useState<CallUi>("idle");
  const [stepBeat, setStepBeat] = useState<StepBeat>("sayGuide");
  const [stepIndex, setStepIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stepProgress, setStepProgress] = useState(emptyStepProgress);
  const [ttsHint, setTtsHint] = useState<string | null>(null);
  const [playingCaller, setPlayingCaller] = useState(false);
  const [busy, setBusy] = useState(false);

  const startedAtRef = useRef<string>("");
  const callerClipIdsRef = useRef<string[]>([]);
  const stepAudioIdsRef = useRef<Partial<Record<CallFlowStepId, string>>>({});
  const callerAutoPlayKeyRef = useRef<string | null>(null);

  const {
    recordingStepId,
    micDenied,
    setMicDenied,
    startStepRecording,
    stopStepRecording,
    getStepBlob,
    reset: resetStepRecorder,
    isRecording,
  } = useStepRecorder();

  useEffect(() => {
    if (!isMockCallScenarioAllowed(scenarioId, userRole)) {
      setScenarioId(MOCK_CALL_STUDENT_SCENARIO_ID);
    }
  }, [scenarioId, userRole]);

  const scenario = useMemo(
    () => mockCallScenarios.find((s) => s.id === scenarioId),
    [scenarioId],
  );

  const currentStepId = CALL_FLOW_STEP_IDS[stepIndex];
  const currentStepMeta = callFlowSteps[stepIndex];
  const stepLines = scenario && currentStepId
    ? linesForStep(scenario, currentStepId)
    : [];
  const coachLines = stepLines.filter((l) => l.speaker === "coach");
  const callerLines = stepLines.filter((l) => l.speaker === "caller");
  const studentLines = stepLines.filter((l) => l.speaker === "student");
  const responseLines = stepLines.filter((l) => l.speaker === "studentResponse");
  const responseScriptLines =
    responseLines.length > 0
      ? responseLines
      : currentStepId === "opening"
        ? []
        : studentLines;
  const toolConfig =
    scenario && currentStepId
      ? getMockCallToolConfig(scenario.id, currentStepId)
      : null;

  useEffect(() => {
    setStepBeat(studentLines.length > 0 ? "sayGuide" : "callerAndRespond");
    callerAutoPlayKeyRef.current = null;
  }, [stepIndex, studentLines.length]);

  const persistStepClip = useCallback(
    async (key: MockCallRecordingKey, blob: Blob) => {
      if (!sessionId) return;
      const storageKey = String(key);
      const flowStepId =
        typeof key === "string" && key.includes("__")
          ? (key.split("__")[0] as CallFlowStepId)
          : (key as CallFlowStepId);
      const id = crypto.randomUUID();
      await persistAudio({
        id,
        sessionId,
        kind: "student",
        stepId: flowStepId,
        mimeType: blob.type,
        createdAt: new Date().toISOString(),
        blob,
      });
      stepAudioIdsRef.current = {
        ...stepAudioIdsRef.current,
        [storageKey]: id,
      };
    },
    [persistAudio, sessionId],
  );

  const finalizeCurrentStepRecording = useCallback(async () => {
    if (!currentStepId || recordingStepId !== currentStepId) return;
    const result = await stopStepRecording();
    if (result) {
      await persistStepClip(result.stepId, result.blob);
    }
  }, [currentStepId, persistStepClip, recordingStepId, stopStepRecording]);

  const playCallerForStep = useCallback(async () => {
    if (!scenario || !sessionId || callerLines.length === 0) return;
    const clipDescriptors =
      currentStepId != null
        ? callerClipsForStep(scenario, currentStepId)
        : [];
    setBusy(true);
    setTtsHint(null);
    setPlayingCaller(true);
    try {
      for (const clip of clipDescriptors) {
        const blob = await fetchCallerClipBlob(clip.clipKey);
        if (!blob) {
          setTtsHint(practiceCopy.mockCallAudioMissing);
          continue;
        }
        const clipId = crypto.randomUUID();
        await persistAudio({
          id: clipId,
          sessionId,
          kind: "caller",
          stepId: clip.stepId,
          mimeType: blob.type || "audio/mpeg",
          createdAt: new Date().toISOString(),
          blob,
        });
        callerClipIdsRef.current = [...callerClipIdsRef.current, clipId];

        await playAudioBlobWithPrefs(blob);
      }
    } catch (err) {
      setTtsHint(
        err instanceof Error ? err.message : practiceCopy.mockCallAudioMissing,
      );
    } finally {
      setPlayingCaller(false);
      setBusy(false);
    }
  }, [callerLines.length, currentStepId, persistAudio, scenario, sessionId]);

  useEffect(() => {
    if (callUi !== "connected" || stepBeat !== "callerAndRespond" || !currentStepId) {
      return;
    }
    const key = `${currentStepId}`;
    if (callerAutoPlayKeyRef.current === key) return;
    callerAutoPlayKeyRef.current = key;
    void playCallerForStep();
  }, [callUi, currentStepId, playCallerForStep, stepBeat]);

  const startCall = useCallback(() => {
    if (!scenario) return;
    primeIncomingCallAudio();
    setStepIndex(0);
    setStepProgress(emptyStepProgress());
    callerClipIdsRef.current = [];
    stepAudioIdsRef.current = {};
    resetStepRecorder();
    setMicDenied(false);
    setTtsHint(null);
    setSessionId(null);
    setStepBeat("sayGuide");
    setCallUi("ringing");
    setActive(true);
  }, [resetStepRecorder, scenario, setMicDenied]);

  const answerCall = useCallback(() => {
    if (!scenario) return;
    const id = newSessionId();
    startedAtRef.current = new Date().toISOString();
    setSessionId(id);
    setCallUi("connected");
    setStepBeat(studentLines.length > 0 ? "sayGuide" : "callerAndRespond");
  }, [scenario, studentLines.length]);

  const cancelRinging = useCallback(() => {
    setActive(false);
    setCallUi("idle");
    setSessionId(null);
  }, []);

  const advanceFromSayGuide = useCallback(async () => {
    setBusy(true);
    try {
      await finalizeCurrentStepRecording();
      setStepBeat("callerAndRespond");
    } finally {
      setBusy(false);
    }
  }, [finalizeCurrentStepRecording]);

  const onPreviousStep = useCallback(async () => {
    if (stepIndex <= 0) return;
    setBusy(true);
    try {
      await finalizeCurrentStepRecording();
      setStepIndex((i) => i - 1);
    } finally {
      setBusy(false);
    }
  }, [finalizeCurrentStepRecording, stepIndex]);

  const onPrevious = useCallback(async () => {
    if (stepBeat === "callerAndRespond" && studentLines.length > 0) {
      setStepBeat("sayGuide");
      return;
    }
    await onPreviousStep();
  }, [onPreviousStep, stepBeat, studentLines.length]);

  const canGoPrevious =
    (stepBeat === "callerAndRespond" && studentLines.length > 0) ||
    stepIndex > 0;

  const onNextStep = useCallback(async () => {
    if (!currentStepId) return;
    setBusy(true);
    try {
      await finalizeCurrentStepRecording();
      setStepProgress((prev) => ({ ...prev, [currentStepId]: "done" }));
      if (stepIndex >= CALL_FLOW_STEP_IDS.length - 1) {
        return;
      }
      setStepIndex((i) => i + 1);
    } finally {
      setBusy(false);
    }
  }, [currentStepId, finalizeCurrentStepRecording, stepIndex]);

  const endCall = useCallback(async () => {
    if (!scenario) return;
    if (callUi === "ringing") {
      cancelRinging();
      return;
    }
    if (!sessionId) return;
    setBusy(true);
    try {
      await finalizeCurrentStepRecording();
      const finalProgress = { ...stepProgress };
      if (currentStepId && finalProgress[currentStepId] === "pending") {
        finalProgress[currentStepId] = "done";
      }
      const clips = callerClipIdsRef.current;
      const session: MockCallSession = {
        id: sessionId,
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        startedAt: startedAtRef.current,
        endedAt: new Date().toISOString(),
        stepProgress: finalProgress,
        studentAudioId: null,
        studentStepAudioIds: { ...stepAudioIdsRef.current },
        callerClipIds: clips,
      };
      await persistSession(session);
      setActive(false);
      setCallUi("idle");
      setSessionId(null);
      resetStepRecorder();
      onSessionSaved();
    } finally {
      setBusy(false);
    }
  }, [
    callUi,
    cancelRinging,
    currentStepId,
    finalizeCurrentStepRecording,
    onSessionSaved,
    persistSession,
    resetStepRecorder,
    scenario,
    sessionId,
    stepProgress,
  ]);

  const onRecordToggle = useCallback(async () => {
    if (!currentStepId) return;
    if (recordingStepId === currentStepId) {
      setBusy(true);
      try {
        const result = await stopStepRecording();
        if (result) {
          await persistStepClip(result.stepId, result.blob);
        }
      } finally {
        setBusy(false);
      }
    } else {
      await startStepRecording(currentStepId);
    }
  }, [
    currentStepId,
    persistStepClip,
    recordingStepId,
    startStepRecording,
    stopStepRecording,
  ]);

  const isRecordingThisStep =
    currentStepId != null && recordingStepId === currentStepId;
  const hasRecording =
    currentStepId != null && Boolean(getStepBlob(currentStepId));

  const sayGuideLabel =
    currentStepId === "opening"
      ? practiceCopy.mockCallBeatOpeningSpiel
      : practiceCopy.mockCallBeatSayGuide;

  const beatSteps: { id: StepBeat; label: string }[] = [
    { id: "sayGuide", label: sayGuideLabel },
    { id: "callerAndRespond", label: practiceCopy.mockCallBeatCallerAndRespond },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">{practiceCopy.mockCallRecordingNote}</p>
      {micDenied ? (
        <p className="text-sm text-amber-800" role="status">
          {practiceCopy.mockCallMicDenied}
        </p>
      ) : null}

      {!active ? (
        <MemberCard className="space-y-4 p-4">
          <div>
            <Label htmlFor="mock-call-scenario">{practiceCopy.mockCallSelectScenario}</Label>
            <select
              id="mock-call-scenario"
              className="mt-2 h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-ink"
              value={scenarioId}
              onChange={(e) => {
                const next = e.target.value;
                if (isMockCallScenarioAllowed(next, userRole)) {
                  setScenarioId(next);
                }
              }}
            >
              {mockCallScenarios.map((s) => {
                const allowed = isMockCallScenarioAllowed(s.id, userRole);
                return (
                  <option key={s.id} value={s.id} disabled={!allowed}>
                    {allowed
                      ? s.title
                      : `${s.title} — ${practiceCopy.mockCallScenarioSuperAdminOnly}`}
                  </option>
                );
              })}
            </select>
            {!canAccessAllMockCallScenarios(userRole) ? (
              <p className="mt-2 text-xs text-muted">
                {practiceCopy.mockCallStudentScenarioHint}
              </p>
            ) : null}
          </div>
          {scenario ? (
            <div className="space-y-2 text-sm">
              <p className="text-muted">{scenario.summary}</p>
              <span className="inline-flex rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold text-navy/80">
                {practiceCopy[moodLabel[scenario.callerMood]]}
              </span>
            </div>
          ) : null}
          <Button type="button" variant="accent" onClick={startCall}>
            {practiceCopy.mockCallStartCall}
          </Button>
        </MemberCard>
      ) : callUi === "ringing" && scenario ? (
        <MemberCard className="p-4">
          <MockCallIncomingCall
            scenarioTitle={scenario.title}
            moodLabel={practiceCopy[moodLabel[scenario.callerMood]]}
            onAnswer={answerCall}
          />
          <div className="mt-4 flex justify-center">
            <Button type="button" variant="ghost" size="sm" onClick={cancelRinging}>
              {practiceCopy.mockCallEndCall}
            </Button>
          </div>
        </MemberCard>
      ) : scenario && sessionId && usesDialogueFlow(scenario.id) ? (
        <MockCallDialogueSession
          scenario={scenario}
          sessionId={sessionId}
          persistSession={persistSession}
          persistAudio={persistAudio}
          onSessionSaved={() => {
            setActive(false);
            setCallUi("idle");
            setSessionId(null);
            resetStepRecorder();
            onSessionSaved();
          }}
        />
      ) : (
        <MemberCard className="space-y-4 p-4">
          {scenario ? (
            <MockCallInCallHeader
              callerName={getMockCallCallerLabel(
                scenario,
                practiceCopy.mockCallGenericCallerName,
              )}
              moodLabel={practiceCopy[moodLabel[scenario.callerMood]]}
              startedAt={startedAtRef.current}
              disabled={busy}
              onEndCall={() => void endCall()}
            />
          ) : null}
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-display font-semibold text-ink">{scenario?.title}</p>
              <p className="text-xs text-muted">
                {practiceCopy.mockCallStepLabel} {currentStepMeta?.order ?? stepIndex + 1}{" "}
                — {currentStepMeta ? practiceCopy[currentStepMeta.titleKey] : ""}
              </p>
            </div>
            {isRecording ? (
              <span className="text-xs font-medium text-navy">
                {practiceCopy.mockCallRecordingThisStep}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {callFlowSteps.map((step, i) => (
              <span
                key={step.id}
                className={cn(
                  "size-2 rounded-full",
                  i < stepIndex || stepProgress[step.id] === "done"
                    ? "bg-teal-bright"
                    : i === stepIndex
                      ? "bg-navy"
                      : "bg-border",
                )}
                aria-hidden
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] font-medium">
            {beatSteps.map((b) => (
              <span
                key={b.id}
                className={cn(
                  "rounded-full px-2.5 py-1",
                  stepBeat === b.id
                    ? "bg-navy text-white"
                    : "bg-surface text-muted",
                )}
              >
                {b.label}
              </span>
            ))}
          </div>

          {stepBeat === "sayGuide" &&
            coachLines.map((line, i) => (
              <div
                key={`coach-${i}`}
                className="rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/60">
                  {practiceCopy.mockCallCoachHint}
                </p>
                <p className="mt-1 whitespace-pre-line text-ink">{line.text}</p>
              </div>
            ))}

          {stepBeat === "sayGuide" && studentLines.length > 0
            ? studentLines.map((line, i) => (
                <div
                  key={`student-${i}`}
                  className="rounded-lg border border-teal-bright/40 bg-teal-bright/10 px-3 py-2 text-sm"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/70">
                    {practiceCopy.mockCallVaLineLabel}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-ink">{line.text}</p>
                  <p className="mt-2 text-xs text-muted">
                    {practiceCopy.mockCallStudentGuideNote}
                  </p>
                </div>
              ))
            : null}

          {stepBeat === "sayGuide" &&
          currentStepId &&
          studentLines.length > 0 &&
          sessionId ? (
            <MockCallStepRecorderControls
              stepId={currentStepId}
              micDenied={micDenied}
              isRecordingThisStep={isRecordingThisStep}
              hasRecording={hasRecording}
              busy={busy}
              onRecord={() => void onRecordToggle()}
              onStop={() => void onRecordToggle()}
              getStepBlob={getStepBlob}
              sectionTitle={practiceCopy.mockCallSayLineRecordHeading}
              emptyHint={practiceCopy.mockCallSayLineNoRecordingYet}
              recordLabel={
                currentStepId === "opening"
                  ? practiceCopy.mockCallRecordOpeningSpiel
                  : practiceCopy.mockCallRecordResponse
              }
            />
          ) : null}

          {stepBeat === "callerAndRespond" ? (
            <>
              {callerLines.length > 0 ? (
                <div className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/60">
                    {practiceCopy.mockCallCallerScript}
                  </p>
                  {callerLines.map((line, i) => (
                    <p key={`caller-${i}`} className="mt-1 text-ink">
                      {line.text}
                    </p>
                  ))}
                  {ttsHint ? (
                    <p className="mt-2 text-xs text-muted" role="status">
                      {ttsHint}
                    </p>
                  ) : null}
                  <MockCallPlayCallerControl
                    isPlaying={playingCaller}
                    disabled={busy}
                    onPlay={() => void playCallerForStep()}
                  />
                </div>
              ) : null}

              {responseScriptLines.length > 0 ? (
                <div className="rounded-lg border border-teal-bright/40 bg-teal-bright/10 px-3 py-2 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/70">
                    {practiceCopy.mockCallStudentGuide}
                  </p>
                  {responseScriptLines.map((line, i) => (
                    <p key={`response-${i}`} className="mt-1 whitespace-pre-line text-ink">
                      {line.text}
                    </p>
                  ))}
                  <p className="mt-2 text-xs text-muted">
                    {practiceCopy.mockCallStudentGuideNote}
                  </p>
                </div>
              ) : null}

              {currentStepId ? (
                <MockCallStepRecorderControls
                  stepId={currentStepId}
                  micDenied={micDenied}
                  isRecordingThisStep={isRecordingThisStep}
                  hasRecording={hasRecording}
                  busy={busy}
                  onRecord={() => void onRecordToggle()}
                  onStop={() => void onRecordToggle()}
                  getStepBlob={getStepBlob}
                />
              ) : null}
            </>
          ) : null}

          {toolConfig &&
          (stepBeat === "sayGuide" || stepBeat === "callerAndRespond") ? (
            <MockCallToolPanel
              key={`${scenario?.id}-${currentStepId}`}
              config={toolConfig}
            />
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
            {stepBeat === "sayGuide" ? (
              <Button
                type="button"
                variant="accent"
                disabled={busy}
                onClick={() => void advanceFromSayGuide()}
              >
                {practiceCopy.mockCallContinueToCaller}
              </Button>
            ) : null}
            {stepBeat === "callerAndRespond" &&
            stepIndex < CALL_FLOW_STEP_IDS.length - 1 ? (
              <Button
                type="button"
                variant="accent"
                disabled={busy}
                onClick={() => void onNextStep()}
              >
                {practiceCopy.mockCallNextStep}
              </Button>
            ) : null}
          </div>
        </MemberCard>
      )}
    </div>
  );
}
