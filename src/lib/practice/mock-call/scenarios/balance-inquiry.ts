import type { MockCallScenario } from "@/lib/practice/mock-call-scenarios";
import {
  MOCK_CALL_STUDENT_NAME_PLACEHOLDER,
  stepScript,
} from "@/lib/practice/mock-call/coach-templates";

export const balanceInquiryScenario: MockCallScenario = {
  id: "balance-inquiry",
  title: "Patient balance inquiry",
  summary:
    "Statement balance vs Insurance payment — neutral caller, Revenue Cycle basics.",
  callerMood: "neutral",
  lines: [
    ...stepScript(
      "opening",
      "Billing calls often start fast — stay calm and professional.",
      {
        studentGuide: `"Good morning, thank you for calling Riverside Family Medicine billing. My name is ${MOCK_CALL_STUDENT_NAME_PLACEHOLDER}, Medical VA support. How can I help you today?"`,
        responseGuide:
          '"I\'d be glad to help you with your statement today. Let\'s review it together."',
        caller: "Hello, I'm calling about a statement I received in the mail.",
      },
    ),
    ...stepScript(
      "rapport",
      "Match their practical, focused tone.",
      {
        studentGuide:
          '"I\'m happy to help with your statement. How are you doing today?"',
        caller:
          "I'm okay, thanks. I'm just trying to make sure I pay the right amount before I go online.",
      },
    ),
    ...stepScript(
      "mainConcern",
      "Repeat back: amount, date of service, and payer if they mention Insurance.",
      {
        studentGuide:
          '"Let me make sure I understand — you\'re seeing two hundred forty dollars for the March twelfth visit, and you believe Insurance may have already paid. Is that correct?"',
        caller:
          "The bill shows two hundred forty dollars for my visit on March twelfth. I thought my Insurance already paid.",
      },
    ),
    ...stepScript(
      "apologyAssurance",
      "Validate confusion — billing statements and EOB timing confuse many patients.",
      {
        studentGuide:
          '"I\'m sorry for the confusion — statements and Insurance explanations don\'t always match right away. I\'ll review your claim and patient balance with you today."',
        caller:
          "It's confusing when the Insurance explanation of benefits looks different from the clinic bill.",
      },
    ),
    ...stepScript(
      "solution",
      "Give clear steps: verify claim, patient responsibility, when they'll hear back.",
      {
        studentGuide:
          '"Here\'s what we can do: I\'ll verify the claim status with your payer today. If there\'s still a balance, we\'ll explain it; if Insurance paid, we\'ll update your account. You\'ll get a portal message within two business days."',
        caller:
          "Okay — so you'll review the claim and let me know if I still owe anything? I can wait on paying until I hear back.",
      },
    ),
    ...stepScript(
      "moreConcerns",
      "Ask about other billing or visit questions.",
      {
        studentGuide:
          '"Is there anything else about this visit or your Insurance I can help with?"',
        caller: "No, that's my only question right now.",
      },
    ),
    ...stepScript(
      "allAddressed",
      "Summarize what you will do and timeline.",
      {
        studentGuide:
          '"To recap: we\'re reviewing the March twelfth claim and will message you within two business days. Does that address everything?"',
        caller:
          "Yes, I'm clear now. Thank you for walking me through it.",
      },
    ),
    ...stepScript(
      "closing",
      "Warm close with practice name.",
      {
        studentGuide:
          '"Thank you for calling Riverside Family Medicine. We appreciate your patience. Have a great day!"',
        caller: "Thank you. Have a good day. Bye bye.",
      },
    ),
  ],
};
