import type { MockCallScenario } from "@/lib/practice/mock-call-scenarios";
import {
  MOCK_CALL_STUDENT_NAME_PLACEHOLDER,
  stepScript,
} from "@/lib/practice/mock-call/coach-templates";

export const wrongInsuranceScenario: MockCallScenario = {
  id: "wrong-insurance-on-file",
  title: "Wrong insurance on file",
  summary:
    "Upset caller after claim denial — update primary Insurance, Eligibility, and rebill.",
  callerMood: "upset",
  lines: [
    ...stepScript(
      "opening",
      "They may sound angry — stay calm; do not argue.",
      {
        studentGuide: `"Good afternoon, thank you for calling Riverside Family Medicine. My name is ${MOCK_CALL_STUDENT_NAME_PLACEHOLDER}, Medical VA billing support. I'm here to help with Insurance and billing — how can I assist you?"`,
        responseGuide:
          '"I\'m sorry you received that denial — I understand that\'s frustrating. I\'ll help you review which Insurance we have on file and what we can fix today."',
        caller:
          "I received a denial letter. You people billed the wrong Insurance company.",
      },
    ),
    ...stepScript(
      "rapport",
      "Empathize with their frustration.",
      {
        studentGuide:
          '"I understand this is frustrating, especially when you\'ve already updated your coverage. How are you doing right now?"',
        caller:
          "I've had Blue Cross since January and nobody updated my chart. This is not my fault.",
      },
    ),
    ...stepScript(
      "mainConcern",
      "Capture payer name, member ID, effective date, denial reason.",
      {
        studentGuide:
          '"Thank you — so your primary Insurance is Blue Cross P P O now, not Aetna, and the denial says not eligible on the date of service. Do you have your new member ID handy?"',
        caller:
          "It's Blue Cross PPO now, not Aetna. The denial says patient not eligible on the date of service.",
      },
    ),
    ...stepScript(
      "apologyAssurance",
      "Own the process fix — avoid blaming the patient.",
      {
        studentGuide:
          '"I\'m sorry for the inconvenience and that you received a denial. Here\'s what we can do: I\'ll update your primary Insurance and rebill the claim correctly."',
        caller:
          "I shouldn't be sent to collections because your office didn't update my Insurance.",
      },
    ),
    ...stepScript(
      "solution",
      "Steps: verify card, update file, resubmit, billing hold if needed.",
      {
        studentGuide:
          '"We\'ll enter Blue Cross as primary, resubmit the claim, and place a hold on patient collections while Insurance reprocesses — usually ten to fifteen business days for the payer."',
        caller:
          "Alright, as long as you resubmit to Blue Cross and don't charge me the full amount while it's pending.",
      },
    ),
    ...stepScript(
      "moreConcerns",
      "Ask if other visits need the same update.",
      {
        studentGuide:
          '"Does anyone else on your account need Insurance updated, or just this visit for you?"',
        caller: "No — just that visit for me.",
      },
    ),
    ...stepScript(
      "allAddressed",
      "Recap updates and how they'll be notified.",
      {
        studentGuide:
          '"Recap: Blue Cross is now primary, claim is being resubmitted, and you\'ll get a new explanation of benefits when the payer responds. Does that cover everything?"',
        caller: "Fine. I'll watch for the new explanation of benefits.",
      },
    ),
    ...stepScript(
      "closing",
      "Professional thank-you.",
      {
        studentGuide:
          '"Thank you for providing your updated Insurance information. We appreciate your patience. Goodbye."',
        caller: "Goodbye.",
      },
    ),
  ],
};
