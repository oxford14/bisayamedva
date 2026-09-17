"use client";

import { useState } from "react";
import { MockCallHistoryPanel } from "@/components/member/practice/mock-call-history-panel";
import { MockCallSessionPanel } from "@/components/member/practice/mock-call-session-panel";
import { practiceCopy } from "@/content/site";
import type { MockCallAudioRecord, MockCallSession } from "@/lib/practice/types";
import type { CallFlowStepId } from "@/lib/practice/call-flow";
import { cn } from "@/lib/utils";

type Segment = "call" | "history";

type Props = {
  userRole: string;
  initialSegment?: Segment;
  sessions: MockCallSession[];
  historyLoading: boolean;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onLoadAudio: (sessionId: string) => Promise<MockCallAudioRecord[]>;
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
  onSessionSaved: () => void;
};

export function MockCallPracticeArea({
  userRole,
  initialSegment = "call",
  sessions,
  historyLoading,
  onDeleteSession,
  onLoadAudio,
  persistSession,
  persistAudio,
  onSessionSaved,
}: Props) {
  const [segment, setSegment] = useState<Segment>(initialSegment);

  const segments: { id: Segment; label: string }[] = [
    { id: "call", label: practiceCopy.mockCallPracticeSegmentCall },
    { id: "history", label: practiceCopy.mockCallPracticeSegmentHistory },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2 sm:justify-start">
        <div
          className="inline-flex rounded-lg border border-border bg-surface/60 p-0.5"
          role="tablist"
          aria-label="Practice sections"
        >
          {segments.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={segment === s.id}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                segment === s.id
                  ? "bg-navy text-white"
                  : "text-muted hover:text-ink",
              )}
              onClick={() => setSegment(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {segment === "call" ? (
        <MockCallSessionPanel
          userRole={userRole}
          onSessionSaved={() => {
            onSessionSaved();
            setSegment("history");
          }}
          persistSession={persistSession}
          persistAudio={persistAudio}
        />
      ) : (
        <MockCallHistoryPanel
          sessions={sessions}
          loading={historyLoading}
          onDelete={onDeleteSession}
          onLoadAudio={onLoadAudio}
        />
      )}
    </div>
  );
}
