"use client";

import { useEffect, useState } from "react";
import { MockCallContextNav } from "@/components/member/practice/mock-call/mock-call-context-nav";
import { MockCallAudioSetupPanel } from "@/components/member/practice/mock-call/mock-call-audio-setup-panel";
import { MockCallHubDashboard } from "@/components/member/practice/mock-call/mock-call-hub-dashboard";
import { MockCallLearnDeck } from "@/components/member/practice/mock-call/mock-call-learn-deck";
import { MockCallPracticeArea } from "@/components/member/practice/mock-call/mock-call-practice-area";
import {
  MockCallSimulationDialog,
  hasAcknowledgedMockCallSimulationReminder,
} from "@/components/member/practice/mock-call/mock-call-simulation-dialog";
import { MockCallWelcome } from "@/components/member/practice/mock-call/mock-call-welcome";
import { practiceCopy } from "@/content/site";
import { prefetchAllMockCallAudio } from "@/lib/practice/mock-call-audio-client";
import { useMockCallSessions } from "@/lib/practice/use-mock-call-sessions";
import { cn } from "@/lib/utils";

type MockCallPhase = "welcome" | "hub" | "learn" | "practice" | "audioSetup";

export function MockCallWorkspace({ ownerUserId }: { ownerUserId: string }) {
  const [phase, setPhase] = useState<MockCallPhase>("welcome");
  const [learnResetKey, setLearnResetKey] = useState(0);
  const [practiceMountKey, setPracticeMountKey] = useState(0);
  const [simulationDialogOpen, setSimulationDialogOpen] = useState(false);
  const [audioStatus, setAudioStatus] = useState<
    "idle" | "loading" | "ready" | "partial"
  >("idle");
  const [audioCounts, setAudioCounts] = useState({ loaded: 0, total: 0 });

  useEffect(() => {
    if (!hasAcknowledgedMockCallSimulationReminder()) {
      setSimulationDialogOpen(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAudioStatus("loading");
    void prefetchAllMockCallAudio().then(({ total, loaded }) => {
      if (cancelled) return;
      setAudioCounts({ loaded, total });
      if (total === 0) {
        setAudioStatus("partial");
        return;
      }
      setAudioStatus(loaded >= total ? "ready" : "partial");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const {
    sessions,
    loading,
    refresh,
    persistSession,
    persistAudio,
    removeSession,
    loadSessionAudio,
  } = useMockCallSessions(ownerUserId);

  const enterLearn = () => {
    setLearnResetKey((k) => k + 1);
    setPhase("learn");
  };

  const enterPractice = () => {
    setPracticeMountKey((k) => k + 1);
    setPhase("practice");
  };

  const enterAudioSetup = () => {
    setPhase("audioSetup");
  };

  return (
    <div className="space-y-4">
      <MockCallSimulationDialog
        open={simulationDialogOpen}
        onClose={() => setSimulationDialogOpen(false)}
      />

      <MockCallContextNav
        phase={phase}
        onBackToHub={() => setPhase("hub")}
      />

      {audioStatus === "loading" || audioStatus === "partial" ? (
        <p
          className={cn(
            "rounded-lg px-3 py-2 text-xs",
            audioStatus === "loading" && "bg-surface text-muted",
            audioStatus === "partial" && "bg-amber-50 text-amber-900",
          )}
          role="status"
        >
          {audioStatus === "loading"
            ? practiceCopy.mockCallAudioPrefetching
            : practiceCopy.mockCallAudioPrefetchPartial
                .replace("{loaded}", String(audioCounts.loaded))
                .replace("{total}", String(audioCounts.total))}
        </p>
      ) : null}

      {phase === "welcome" ? (
        <MockCallWelcome onContinue={() => setPhase("hub")} />
      ) : null}

      {phase === "hub" ? (
        <MockCallHubDashboard
          onSelectLearn={enterLearn}
          onSelectPractice={enterPractice}
          onSelectAudioSetup={enterAudioSetup}
        />
      ) : null}

      {phase === "audioSetup" ? (
        <MockCallAudioSetupPanel onBackToHub={() => setPhase("hub")} />
      ) : null}

      {phase === "learn" ? (
        <MockCallLearnDeck
          resetKey={learnResetKey}
          onBackToHub={() => setPhase("hub")}
          onGoPractice={enterPractice}
        />
      ) : null}

      {phase === "practice" ? (
        <MockCallPracticeArea
          key={practiceMountKey}
          sessions={sessions}
          historyLoading={loading}
          onDeleteSession={removeSession}
          onLoadAudio={loadSessionAudio}
          persistSession={persistSession}
          persistAudio={persistAudio}
          onSessionSaved={() => {
            void refresh();
          }}
        />
      ) : null}
    </div>
  );
}
