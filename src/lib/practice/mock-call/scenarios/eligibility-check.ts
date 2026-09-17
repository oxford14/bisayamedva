import type { MockCallScenario } from "@/lib/practice/mock-call-scenarios";
import {
  MOCK_CALL_STUDENT_NAME_PLACEHOLDER,
  stepScript,
} from "@/lib/practice/mock-call/coach-templates";

export const eligibilityCheckScenario: MockCallScenario = {
  id: "eligibility-benefits-check",
  title: "Eligibility and benefits check",
  summary:
    "Caller verifying coverage before a specialist visit — Medical VA Eligibility workflow.",
  callerMood: "neutral",
  lines: [
    ...stepScript(
      "opening",
      "Eligibility calls need clear, confident tone.",
      {
        studentGuide: `"Good morning, thank you for calling Summit Primary Care. My name is ${MOCK_CALL_STUDENT_NAME_PLACEHOLDER}, Medical VA support. How may I help you?"`,
        responseGuide:
          '"Sure — I can help you confirm your Insurance eligibility for that referral. May I have your name and date of birth?"',
        caller:
          "Hello, I have a referral to a specialist and I want to confirm my Insurance is active.",
      },
    ),
    ...stepScript(
      "rapport",
      "Acknowledge their desire to avoid surprises.",
      {
        studentGuide:
          '"I\'m glad you called ahead — that\'s smart. How are you doing today?"',
        caller:
          "I'm doing fine. I just don't want a surprise bill if something isn't covered.",
      },
    ),
    ...stepScript(
      "mainConcern",
      "Get payer, member ID, date of birth, upcoming visit date.",
      {
        studentGuide:
          '"So you\'re seeing a cardiologist next Monday and you want to confirm you\'re in-network and your copay is still forty dollars — let me verify those details with you."',
        caller:
          "I'm seeing a cardiologist next Monday. Can you confirm I'm in-network and that my copay is still forty dollars?",
      },
    ),
    ...stepScript(
      "apologyAssurance",
      "Reassure about Eligibility process if they had a bad past experience.",
      {
        studentGuide:
          '"I\'m sorry you had a billing surprise before. I\'ll run Eligibility for your specialist visit and make sure your benefits look correct before you go."',
        caller:
          "Last time a clinic said I was covered and I still got a bill later.",
      },
    ),
    ...stepScript(
      "solution",
      "Explain real-time Eligibility, portal message, referral if needed.",
      {
        studentGuide:
          '"Here\'s what we can do: I\'ll verify active coverage and copay today and send you a portal message. If anything looks off, we\'ll call you before Monday."',
        caller:
          "So you'll run Eligibility today and message me in the patient portal if anything looks off?",
      },
    ),
    ...stepScript(
      "moreConcerns",
      "Common add-on: insurance card at specialist.",
      {
        studentGuide:
          '"Anything else — referral on file, prior auth, or what to bring to the visit?"',
        caller:
          "Do I need to bring my new Insurance card to the specialist?",
      },
    ),
    ...stepScript(
      "allAddressed",
      "Confirm plan and card reminder.",
      {
        studentGuide:
          '"Yes — bring your current Insurance card to the specialist. Eligibility check is in progress and we\'ll portal-message you today. Does that answer everything?"',
        caller: "Yes, that answers my questions. Thank you.",
      },
    ),
    ...stepScript(
      "closing",
      "Close with practice name.",
      {
        studentGuide:
          '"Thank you for calling Summit Primary Care. Have a great day!"',
        caller: "Thanks. Bye now.",
      },
    ),
  ],
};
