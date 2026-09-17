import type { CallFlowStepId } from "@/lib/practice/call-flow";
import { getDialoguePages } from "@/lib/practice/mock-call/dialogue-flow";
import type { MockCallScenario } from "@/lib/practice/mock-call-scenarios";

export const MOCK_CALL_MANIFEST_PATH = "/practice/mock-call/manifest.json";

export type MockCallAudioManifest = {
  version: number;
  generatedAt: string;
  clips: Record<string, string>;
};

export function callerClipKey(
  scenarioId: string,
  stepId: CallFlowStepId,
  indexInStep: number,
): string {
  return `${scenarioId}__${stepId}__${indexInStep}`;
}

/** Relative path under /public (no leading public). */
export function callerClipRelativePath(
  scenarioId: string,
  stepId: CallFlowStepId,
  indexInStep: number,
): string {
  return `practice/mock-call/audio/${scenarioId}/${stepId}-${indexInStep}.mp3`;
}

export function publicUrlForClip(relativePath: string): string {
  return `/${relativePath.replace(/^\/+/, "")}`;
}

export type ScenarioCallerClipDescriptor = {
  clipKey: string;
  stepId: CallFlowStepId;
  text: string;
  indexInStep: number;
  relativePath: string;
};

/** Every caller line in scenario order (for generation). */
export function listScenarioCallerClips(
  scenario: MockCallScenario,
): ScenarioCallerClipDescriptor[] {
  const perStep = new Map<CallFlowStepId, number>();
  const out: ScenarioCallerClipDescriptor[] = [];

  for (const line of scenario.lines) {
    if (line.speaker !== "caller") continue;
    const indexInStep = perStep.get(line.stepId) ?? 0;
    perStep.set(line.stepId, indexInStep + 1);
    const relativePath = callerClipRelativePath(
      scenario.id,
      line.stepId,
      indexInStep,
    );
    out.push({
      clipKey: callerClipKey(scenario.id, line.stepId, indexInStep),
      stepId: line.stepId,
      text: line.text,
      indexInStep,
      relativePath,
    });
  }

  return out;
}

export function callerClipsForStep(
  scenario: MockCallScenario,
  stepId: CallFlowStepId,
): ScenarioCallerClipDescriptor[] {
  return listScenarioCallerClips(scenario).filter((c) => c.stepId === stepId);
}

export function dialogueClipKey(scenarioId: string, pageId: string): string {
  return `${scenarioId}__dialogue__${pageId}`;
}

export function dialogueClipRelativePath(
  scenarioId: string,
  pageId: string,
): string {
  return `practice/mock-call/audio/${scenarioId}/dialogue-${pageId}.mp3`;
}

export type DialogueCallerClipDescriptor = {
  clipKey: string;
  pageId: string;
  text: string;
  relativePath: string;
};

export function listDialogueCallerClips(
  scenarioId: string,
): DialogueCallerClipDescriptor[] {
  const pages = getDialoguePages(scenarioId);
  if (!pages) return [];
  const out: DialogueCallerClipDescriptor[] = [];
  for (const page of pages) {
    if (!page.callerText?.trim()) continue;
    out.push({
      clipKey: dialogueClipKey(scenarioId, page.id),
      pageId: page.id,
      text: page.callerText.trim(),
      relativePath: dialogueClipRelativePath(scenarioId, page.id),
    });
  }
  return out;
}

/** Legacy step caller lines + dialogue page clips (for audio generation). */
export function listAllCallerClipsForScenario(
  scenario: MockCallScenario,
): Array<
  | ScenarioCallerClipDescriptor
  | (DialogueCallerClipDescriptor & { stepId?: CallFlowStepId })
> {
  const legacy = listScenarioCallerClips(scenario);
  const dialogue = listDialogueCallerClips(scenario.id);
  return [...legacy, ...dialogue];
}
