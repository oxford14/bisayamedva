import type { CallFlowStepId } from "@/lib/practice/call-flow";
import { balanceInquiryScenario } from "@/lib/practice/mock-call/scenarios/balance-inquiry";
import { basicCallFlowTraining } from "@/lib/practice/mock-call/scenarios/basic-training";
import { claimStatusScenario } from "@/lib/practice/mock-call/scenarios/claim-status";
import { eligibilityCheckScenario } from "@/lib/practice/mock-call/scenarios/eligibility-check";
import { priorAuthDelayScenario } from "@/lib/practice/mock-call/scenarios/prior-auth-delay";
import { rescheduleAppointmentScenario } from "@/lib/practice/mock-call/scenarios/reschedule-appointment";
import { wrongInsuranceScenario } from "@/lib/practice/mock-call/scenarios/wrong-insurance";

export type MockCallCallerMood = "happy" | "neutral" | "upset" | "worried";

export type MockCallLineSpeaker =
  | "coach"
  | "caller"
  | "student"
  | "studentResponse";

export type MockCallScenarioLine = {
  stepId: CallFlowStepId;
  speaker: MockCallLineSpeaker;
  text: string;
};

export type MockCallScenario = {
  id: string;
  title: string;
  summary: string;
  callerMood: MockCallCallerMood;
  /** Shown in the in-call header when the patient name is known */
  callerDisplayName?: string;
  /** Optional ElevenLabs voice_id override for this scenario */
  voiceId?: string;
  lines: MockCallScenarioLine[];
};

export function getMockCallCallerLabel(
  scenario: MockCallScenario,
  genericLabel: string,
): string {
  return scenario.callerDisplayName?.trim() || genericLabel;
}

/** Training first, then role-play scenarios (all eight steps each). */
export const mockCallScenarios: MockCallScenario[] = [
  basicCallFlowTraining,
  balanceInquiryScenario,
  priorAuthDelayScenario,
  rescheduleAppointmentScenario,
  wrongInsuranceScenario,
  eligibilityCheckScenario,
  claimStatusScenario,
];

export function getMockCallScenario(id: string): MockCallScenario | undefined {
  return mockCallScenarios.find((s) => s.id === id);
}

export function linesForStep(
  scenario: MockCallScenario,
  stepId: CallFlowStepId,
): MockCallScenarioLine[] {
  return scenario.lines.filter((l) => l.stepId === stepId);
}

export {
  getMockCallToolConfig,
  type MockCallToolConfig,
  type MockCallToolId,
} from "@/lib/practice/mock-call/tool-config";
