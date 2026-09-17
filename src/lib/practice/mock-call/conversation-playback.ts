import { CALL_FLOW_STEP_IDS } from "@/lib/practice/call-flow";
import { dialogueClipKey } from "@/lib/practice/mock-call/audio-keys";
import {
  dialogueRecordingKey,
  getDialoguePages,
  usesDialogueFlow,
} from "@/lib/practice/mock-call/dialogue-flow";
import type { MockCallAudioRecord, MockCallSession } from "@/lib/practice/types";

export type ConversationPlaybackSegment = {
  kind: "student" | "caller";
  label?: string;
  getBlob: () => Promise<Blob | null>;
};

export type ConversationPlaybackOptions = {
  fetchBundledCaller?: (clipKey: string) => Promise<Blob | null>;
};

function clipById(clips: MockCallAudioRecord[]): Map<string, MockCallAudioRecord> {
  return new Map(clips.map((c) => [c.id, c]));
}

function orderedCallerClips(
  session: MockCallSession,
  clips: MockCallAudioRecord[],
): MockCallAudioRecord[] {
  const byId = clipById(clips);
  return session.callerClipIds
    .map((id) => byId.get(id))
    .filter((c): c is MockCallAudioRecord => c != null && c.kind === "caller");
}

function studentSegment(
  session: MockCallSession,
  clips: MockCallAudioRecord[],
  recordingKey: string,
  label?: string,
): ConversationPlaybackSegment | null {
  const audioId = session.studentStepAudioIds?.[recordingKey];
  if (!audioId) return null;
  const record = clips.find((c) => c.id === audioId);
  if (!record) return null;
  return {
    kind: "student",
    label,
    getBlob: async () => record.blob,
  };
}

function pushSegment(
  queue: ConversationPlaybackSegment[],
  segment: ConversationPlaybackSegment | null,
) {
  if (segment) queue.push(segment);
}

function buildDialogueQueue(
  session: MockCallSession,
  clips: MockCallAudioRecord[],
  options: ConversationPlaybackOptions,
): ConversationPlaybackSegment[] {
  const pages = getDialoguePages(session.scenarioId);
  if (!pages) return [];

  const queue: ConversationPlaybackSegment[] = [];
  const orderedCallers = orderedCallerClips(session, clips);
  let legacyCallerIdx = 0;

  pushSegment(queue, studentSegment(session, clips, "opening", "opening"));

  const resolveCallerForPage = (pageId: string): ConversationPlaybackSegment | null => {
    const page = pages.find((p) => p.id === pageId);
    if (!page?.callerText?.trim()) return null;

    const matchingIds = session.callerClipIds.filter((id) => {
      const clip = clips.find((c) => c.id === id);
      return clip?.kind === "caller" && clip.dialoguePageId === pageId;
    });
    if (matchingIds.length > 0) {
      const lastId = matchingIds[matchingIds.length - 1];
      const record = clips.find((c) => c.id === lastId);
      if (record) {
        return {
          kind: "caller",
          label: pageId,
          getBlob: async () => record.blob,
        };
      }
    }

    while (legacyCallerIdx < orderedCallers.length) {
      const clip = orderedCallers[legacyCallerIdx++];
      if (clip.dialoguePageId && clip.dialoguePageId !== pageId) continue;
      return {
        kind: "caller",
        label: pageId,
        getBlob: async () => clip.blob,
      };
    }

    const clipKey = dialogueClipKey(session.scenarioId, pageId);
    const fetchBundled = options.fetchBundledCaller;
    if (!fetchBundled) return null;
    return {
      kind: "caller",
      label: pageId,
      getBlob: () => fetchBundled(clipKey),
    };
  };

  for (const page of pages) {
    const studentKey = dialogueRecordingKey(page);
    const student = studentSegment(session, clips, studentKey, page.id);
    const caller = resolveCallerForPage(page.id);

    if (page.leadSpeaker === "caller") {
      pushSegment(queue, caller);
      pushSegment(queue, student);
    } else {
      pushSegment(queue, student);
      pushSegment(queue, caller);
    }
  }

  return queue;
}

function buildLegacyQueue(
  session: MockCallSession,
  clips: MockCallAudioRecord[],
  options: ConversationPlaybackOptions,
): ConversationPlaybackSegment[] {
  const queue: ConversationPlaybackSegment[] = [];
  const orderedCallers = orderedCallerClips(session, clips);
  const perStepKeys = CALL_FLOW_STEP_IDS.filter(
    (id) => session.studentStepAudioIds?.[id],
  );
  const hasPerStepStudent = perStepKeys.length > 0;

  if (!hasPerStepStudent && session.studentAudioId) {
    const whole = clips.find((c) => c.id === session.studentAudioId);
    if (whole) {
      queue.push({
        kind: "student",
        label: "whole",
        getBlob: async () => whole.blob,
      });
    }
  }

  for (const stepId of CALL_FLOW_STEP_IDS) {
    if (hasPerStepStudent) {
      pushSegment(queue, studentSegment(session, clips, stepId, stepId));
    }
    for (const clip of orderedCallers) {
      if (clip.stepId !== stepId) continue;
      queue.push({
        kind: "caller",
        label: stepId,
        getBlob: async () => clip.blob,
      });
    }
  }

  if (queue.length === 0 && orderedCallers.length > 0) {
    for (const clip of orderedCallers) {
      queue.push({
        kind: "caller",
        getBlob: async () => clip.blob,
      });
    }
  }

  void options;
  return queue;
}

export function buildConversationPlaybackQueue(
  session: MockCallSession,
  clips: MockCallAudioRecord[],
  options: ConversationPlaybackOptions = {},
): ConversationPlaybackSegment[] {
  if (usesDialogueFlow(session.scenarioId)) {
    return buildDialogueQueue(session, clips, options);
  }
  return buildLegacyQueue(session, clips, options);
}

export function studentRecordingCount(session: MockCallSession): number {
  const ids = session.studentStepAudioIds ?? {};
  return Object.keys(ids).filter((key) => Boolean(ids[key])).length;
}

/** Sync check for history UI before audio blobs are loaded. */
export function canPlayFullConversation(session: MockCallSession): boolean {
  if (session.studentAudioId) return true;
  if (studentRecordingCount(session) > 0) return true;
  if (session.callerClipIds.length > 0) return true;
  if (usesDialogueFlow(session.scenarioId)) {
    const pages = getDialoguePages(session.scenarioId);
    return pages != null && pages.some((p) => Boolean(p.callerText?.trim()));
  }
  return false;
}
