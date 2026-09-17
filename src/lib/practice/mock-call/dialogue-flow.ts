import type { CallFlowStepId } from "@/lib/practice/call-flow";

export type MockCallDialogueLeadSpeaker = "caller" | "student";

export type MockCallDialogueToolKey =
  | "chartLookup"
  | "scheduleBrowse"
  | "scheduleBook10";

export type MockCallDialogueRequireBooking = {
  weekday: "Mon";
  time: "10:00 AM";
};

export type MockCallDialoguePage = {
  id: string;
  callFlowStepId: CallFlowStepId;
  leadSpeaker: MockCallDialogueLeadSpeaker;
  callerText?: string;
  studentText?: string;
  coachHint?: string;
  toolKey?: MockCallDialogueToolKey;
  requireBooking?: MockCallDialogueRequireBooking;
};

export function dialogueRecordingKey(page: MockCallDialoguePage): string {
  return `${page.callFlowStepId}__${page.id}`;
}

const BASIC_CALL_FLOW_TRAINING_DIALOGUE: MockCallDialoguePage[] = [
  {
    id: "p0",
    callFlowStepId: "opening",
    leadSpeaker: "caller",
    callerText:
      "Hi, good morning. I need help with an appointment, please.",
    studentText:
      "Absolutely — I'd be happy to help you with your appointment today. May I have your name and date of birth to pull up your chart?",
  },
  {
    id: "p1",
    callFlowStepId: "opening",
    leadSpeaker: "caller",
    coachHint:
      "Jane Doe gave name ug DOB — search sa Schedule while you keep rapport on the phone.",
    callerText:
      "My name is Jane Doe — date of birth April twelfth, nineteen eighty-five.",
    studentText:
      "I'm glad you reached out. While I pull up your appointment, how are you doing today?",
    toolKey: "chartLookup",
  },
  {
    id: "p2",
    callFlowStepId: "rapport",
    leadSpeaker: "caller",
    coachHint: "Listen for tone — this caller is calm and cooperative.",
    callerText:
      "I'm doing alright, thank you. Just a little busy at work today.",
    studentText:
      "That's good to hear. What can I help you with regarding your appointment today?",
  },
  {
    id: "p3",
    callFlowStepId: "mainConcern",
    leadSpeaker: "caller",
    coachHint:
      "Clarify date, provider, and what they need changed. Repeat back key details.",
    callerText:
      "I have a follow-up on Friday, but I need to know if I can move it to Monday instead.",
    studentText:
      "Thank you for explaining that. So you have a follow-up on Friday and you'd like to move it to Monday — did I get that right?",
  },
  {
    id: "p4",
    callFlowStepId: "apologyAssurance",
    leadSpeaker: "caller",
    coachHint:
      "Even for small requests, acknowledge their time and confirm you will help.",
    callerText:
      "I hope it's not too much trouble — I forgot to ask when I was in the office.",
    studentText:
      "Not a problem at all — I'm happy to help with the reschedule. I'll do my best to find a Monday slot that works for you.",
    toolKey: "scheduleBrowse",
  },
  {
    id: "p5",
    callFlowStepId: "solution",
    leadSpeaker: "student",
    coachHint:
      "Offer two options if possible. Use positive words: we can, you'll receive, next step.",
    studentText:
      "Here's what we can do: I have Monday at nine-thirty or Monday at ten a.m. with your provider. Which works better for you?",
    callerText:
      "Monday morning would be perfect if you have something around ten o'clock.",
  },
  {
    id: "p6",
    callFlowStepId: "solution",
    leadSpeaker: "student",
    studentText:
      "Great — I'll book ten a.m. Monday. Before we finish, is there anything else I can help you with today?",
    callerText:
      "Actually, will I need to fill out forms again since it's just a reschedule?",
    toolKey: "scheduleBook10",
    requireBooking: { weekday: "Mon", time: "10:00 AM" },
  },
  {
    id: "p7",
    callFlowStepId: "allAddressed",
    leadSpeaker: "student",
    coachHint: "Include the new date and time in your recap.",
    studentText:
      "For the forms — since it's a reschedule, you shouldn't need new intake paperwork. Your visit is set for Monday at ten a.m. Does that cover everything for you?",
    callerText:
      "Yes, that's everything. Thank you for checking on the forms.",
  },
  {
    id: "p8",
    callFlowStepId: "closing",
    leadSpeaker: "student",
    coachHint: "Thank them and close with practice name.",
    studentText:
      "Thank you for calling Riverside Family Medicine. We'll send your confirmation shortly. Have a wonderful day!",
    callerText: "Thanks for your help today. Goodbye.",
  },
];

const DIALOGUE_BY_SCENARIO: Record<string, MockCallDialoguePage[]> = {
  "basic-call-flow-training": BASIC_CALL_FLOW_TRAINING_DIALOGUE,
};

export function getDialoguePages(
  scenarioId: string,
): MockCallDialoguePage[] | null {
  return DIALOGUE_BY_SCENARIO[scenarioId] ?? null;
}

export function usesDialogueFlow(scenarioId: string): boolean {
  return getDialoguePages(scenarioId) != null;
}
