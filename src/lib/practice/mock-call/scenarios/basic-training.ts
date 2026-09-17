import type { MockCallScenario } from "@/lib/practice/mock-call-scenarios";
import {
  MOCK_CALL_STUDENT_NAME_PLACEHOLDER,
  stepScript,
} from "@/lib/practice/mock-call/coach-templates";

export const basicCallFlowTraining: MockCallScenario = {
  id: "basic-call-flow-training",
  title: "Basic call flow (training)",
  summary:
    "Full eight-step drill — generic scheduling question. Practice every part of the Medical VA call flow before harder scenarios.",
  callerMood: "neutral",
  callerDisplayName: "Jane Doe",
  lines: [
    ...stepScript(
      "opening",
      "Wait for the caller after your opening. Stay warm and professional.",
      {
        studentGuide: `"Good morning, thank you for calling Riverside Family Medicine. My name is ${MOCK_CALL_STUDENT_NAME_PLACEHOLDER}, Medical VA support. How may I help you today?"`,
      },
    ),
    ...stepScript(
      "rapport",
      "Listen for tone — this caller is calm and cooperative.",
      {},
    ),
    ...stepScript(
      "mainConcern",
      "Clarify date, provider, and what they need changed. Repeat back key details.",
      {},
    ),
    ...stepScript(
      "apologyAssurance",
      "Even for small requests, acknowledge their time and confirm you will help.",
      {},
    ),
    ...stepScript(
      "solution",
      "Offer two options if possible. Use positive words: we can, you'll receive, next step.",
      {},
    ),
    ...stepScript(
      "moreConcerns",
      "Invite other questions about the visit, forms, or reminders.",
      {},
    ),
    ...stepScript(
      "allAddressed",
      "Include the new date and time in your recap.",
      {},
    ),
    ...stepScript(
      "closing",
      "Thank them and close with practice name.",
      {},
    ),
  ],
};
