/** Medical VA phone call handling — teaching order for Mock Call sim. */
export const CALL_FLOW_STEP_IDS = [
  "opening",
  "rapport",
  "mainConcern",
  "apologyAssurance",
  "solution",
  "moreConcerns",
  "allAddressed",
  "closing",
] as const;

export type CallFlowStepId = (typeof CALL_FLOW_STEP_IDS)[number];

export type CallFlowStep = {
  id: CallFlowStepId;
  order: number;
  titleKey: keyof typeof import("@/content/site").practiceCopy;
  vaFocusKey: keyof typeof import("@/content/site").practiceCopy;
  exampleVaKey: keyof typeof import("@/content/site").practiceCopy;
  callerBehaviorKey: keyof typeof import("@/content/site").practiceCopy;
};

export const callFlowSteps: CallFlowStep[] = [
  {
    id: "opening",
    order: 1,
    titleKey: "mockCallStepOpeningTitle",
    vaFocusKey: "mockCallStepOpeningVaFocus",
    exampleVaKey: "mockCallStepOpeningExample",
    callerBehaviorKey: "mockCallStepOpeningCaller",
  },
  {
    id: "rapport",
    order: 2,
    titleKey: "mockCallStepRapportTitle",
    vaFocusKey: "mockCallStepRapportVaFocus",
    exampleVaKey: "mockCallStepRapportExample",
    callerBehaviorKey: "mockCallStepRapportCaller",
  },
  {
    id: "mainConcern",
    order: 3,
    titleKey: "mockCallStepMainConcernTitle",
    vaFocusKey: "mockCallStepMainConcernVaFocus",
    exampleVaKey: "mockCallStepMainConcernExample",
    callerBehaviorKey: "mockCallStepMainConcernCaller",
  },
  {
    id: "apologyAssurance",
    order: 4,
    titleKey: "mockCallStepApologyTitle",
    vaFocusKey: "mockCallStepApologyVaFocus",
    exampleVaKey: "mockCallStepApologyExample",
    callerBehaviorKey: "mockCallStepApologyCaller",
  },
  {
    id: "solution",
    order: 5,
    titleKey: "mockCallStepSolutionTitle",
    vaFocusKey: "mockCallStepSolutionVaFocus",
    exampleVaKey: "mockCallStepSolutionExample",
    callerBehaviorKey: "mockCallStepSolutionCaller",
  },
  {
    id: "moreConcerns",
    order: 6,
    titleKey: "mockCallStepMoreConcernsTitle",
    vaFocusKey: "mockCallStepMoreConcernsVaFocus",
    exampleVaKey: "mockCallStepMoreConcernsExample",
    callerBehaviorKey: "mockCallStepMoreConcernsCaller",
  },
  {
    id: "allAddressed",
    order: 7,
    titleKey: "mockCallStepAllAddressedTitle",
    vaFocusKey: "mockCallStepAllAddressedVaFocus",
    exampleVaKey: "mockCallStepAllAddressedExample",
    callerBehaviorKey: "mockCallStepAllAddressedCaller",
  },
  {
    id: "closing",
    order: 8,
    titleKey: "mockCallStepClosingTitle",
    vaFocusKey: "mockCallStepClosingVaFocus",
    exampleVaKey: "mockCallStepClosingExample",
    callerBehaviorKey: "mockCallStepClosingCaller",
  },
];

export function isCallFlowStepId(value: string): value is CallFlowStepId {
  return (CALL_FLOW_STEP_IDS as readonly string[]).includes(value);
}

export function emptyStepProgress(): Record<
  CallFlowStepId,
  "pending" | "done" | "skipped"
> {
  return CALL_FLOW_STEP_IDS.reduce(
    (acc, id) => {
      acc[id] = "pending";
      return acc;
    },
    {} as Record<CallFlowStepId, "pending" | "done" | "skipped">,
  );
}
