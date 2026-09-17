import type { CallFlowStepId } from "@/lib/practice/call-flow";
import type { MockCallScenarioLine } from "@/lib/practice/mock-call-scenarios";

/** Fill-in for example VA scripts — student says their own name aloud. */
export const MOCK_CALL_STUDENT_NAME_PLACEHOLDER = "________";

export type StepScriptOptions = {
  caller?: string;
  /** Extra caller lines for the same step (played in order after `caller`). */
  extraCallers?: string[];
  /** VA line for beat 1 (opening spiel or say-your-line). */
  studentGuide?: string;
  /** Suggested line after you hear the caller (beat 2). */
  responseGuide?: string;
};

/** Coach + optional student guide + optional caller line for one step. */
export function stepScript(
  stepId: CallFlowStepId,
  coach: string,
  options?: StepScriptOptions | string,
): MockCallScenarioLine[] {
  const opts: StepScriptOptions =
    typeof options === "string" ? { caller: options } : (options ?? {});

  const lines: MockCallScenarioLine[] = [
    { stepId, speaker: "coach", text: coach },
  ];
  if (opts.studentGuide?.trim()) {
    lines.push({ stepId, speaker: "student", text: opts.studentGuide.trim() });
  }
  if (opts.responseGuide?.trim()) {
    lines.push({
      stepId,
      speaker: "studentResponse",
      text: opts.responseGuide.trim(),
    });
  }
  if (opts.caller?.trim()) {
    lines.push({ stepId, speaker: "caller", text: opts.caller.trim() });
  }
  for (const line of opts.extraCallers ?? []) {
    if (line.trim()) {
      lines.push({ stepId, speaker: "caller", text: line.trim() });
    }
  }
  return lines;
}
