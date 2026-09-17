import type { MockCallScenario } from "@/lib/practice/mock-call-scenarios";
import {
  MOCK_CALL_STUDENT_NAME_PLACEHOLDER,
  stepScript,
} from "@/lib/practice/mock-call/coach-templates";

export const claimStatusScenario: MockCallScenario = {
  id: "claim-status-follow-up",
  title: "Claim status follow-up",
  summary:
    "Caller checking whether Insurance processed a claim — Revenue Cycle tracking and patient updates.",
  callerMood: "worried",
  lines: [
    ...stepScript(
      "opening",
      "They may be anxious about bills — stay reassuring.",
      {
        studentGuide: `"Good afternoon, thank you for calling Riverside Family Medicine. My name is ${MOCK_CALL_STUDENT_NAME_PLACEHOLDER}, Medical VA billing support. How can I help you today?"`,
        responseGuide:
          '"Of course — I can help you check on that claim. Let me look up your account and the date of service."',
        caller:
          "Hi, I'm checking on a claim for my lab work from last month. I haven't seen anything from Insurance.",
      },
    ),
    ...stepScript(
      "rapport",
      "Validate that waiting is hard.",
      {
        studentGuide:
          '"I understand — waiting on Insurance updates can be stressful. How are you doing today?"',
        caller:
          "I'm a little stressed about it. The lab said they would bill Insurance first.",
      },
    ),
    ...stepScript(
      "mainConcern",
      "Get date of service, test type, payer.",
      {
        studentGuide:
          '"Let me confirm: blood work on April eighth, and you want to know if the claim was submitted and whether it\'s paid, pending, or denied — is that right?"',
        caller:
          "It was blood work on April eighth. I want to know if the claim was submitted and if it's paid or denied.",
      },
    ),
    ...stepScript(
      "apologyAssurance",
      "Commit to looking up the account today.",
      {
        studentGuide:
          '"I\'m sorry you haven\'t had a clear update. I\'ll look up your lab claim status in our system right now and explain what we see."',
        caller:
          "Waiting without updates is hard. I just need someone to actually look it up.",
      },
    ),
    ...stepScript(
      "solution",
      "Share status, next action, collections note if pending.",
      {
        studentGuide:
          '"Here\'s what we can do: the claim shows submitted and pending with your payer. I\'ll note your account so billing won\'t send collections while we wait — typical payer processing is about two weeks."',
        caller:
          "If it's still pending, can you note my account so billing doesn't send me to collections?",
      },
    ),
    ...stepScript(
      "moreConcerns",
      "Invite other billing questions.",
      {
        studentGuide:
          '"Is there anything else about this lab visit or other claims I can help with?"',
        caller: "No other concerns — just those labs.",
      },
    ),
    ...stepScript(
      "allAddressed",
      "Recap status and hold.",
      {
        studentGuide:
          '"Recap: April eighth labs — claim pending, collections hold on your account, and we\'ll update you when the payer responds. Does that work for you?"',
        caller: "Yes, I'm good with that plan.",
      },
    ),
    ...stepScript(
      "closing",
      "Thank them for calling.",
      {
        studentGuide:
          '"Thank you for calling Riverside Family Medicine. We\'ll keep you posted. Have a good day!"',
        caller: "Thank you for checking. Goodbye.",
      },
    ),
  ],
};
