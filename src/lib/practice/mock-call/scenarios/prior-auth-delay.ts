import type { MockCallScenario } from "@/lib/practice/mock-call-scenarios";
import {
  MOCK_CALL_STUDENT_NAME_PLACEHOLDER,
  stepScript,
} from "@/lib/practice/mock-call/coach-templates";

export const priorAuthDelayScenario: MockCallScenario = {
  id: "prior-auth-delay",
  title: "Prior authorization delay",
  summary:
    "Worried caller waiting on Imaging prior auth — empathy plus Insurance workflow clarity.",
  callerMood: "worried",
  lines: [
    ...stepScript(
      "opening",
      "They may sound anxious from the first sentence — stay steady.",
      {
        studentGuide: `"Good afternoon, thank you for calling Lakeside Orthopedics. My name is ${MOCK_CALL_STUDENT_NAME_PLACEHOLDER}, Medical VA support. How may I assist you today?"`,
        responseGuide:
          '"Thank you for calling — I know waiting on prior auth can be stressful. I\'ll check the status of your M R I authorization with Insurance today."',
        caller:
          "Hi, I'm calling about an M R I my doctor ordered. The front desk said Insurance still hasn't approved it.",
      },
    ),
    ...stepScript(
      "rapport",
      "Empathize without over-promising approval.",
      {
        studentGuide:
          '"I hear you\'ve been waiting on news about your M R I — that can be really stressful. How are you holding up today?"',
        caller:
          "Honestly, I'm pretty anxious. My doctor said not to wait too long, and it's been over a week with no update.",
      },
    ),
    ...stepScript(
      "mainConcern",
      "Confirm procedure, ordering provider, payer, and what they've been told.",
      {
        studentGuide:
          '"Thank you for sharing that. You need to know if prior authorization was submitted and whether your Insurance has approved it yet — is that your main question?"',
        caller:
          "I need to know if the prior authorization was submitted and if my Insurance approved it yet.",
      },
    ),
    ...stepScript(
      "apologyAssurance",
      "Do not promise approval — promise diligent follow-up.",
      {
        studentGuide:
          '"I\'m sorry for the wait and any worry this has caused. I can\'t speak for the payer\'s decision, but I will check our authorization queue and follow up with you today."',
        caller:
          "I'm scared they'll deny it and I'll have to delay surgery.",
      },
    ),
    ...stepScript(
      "solution",
      "Share reference number, turnaround, callback plan if applicable.",
      {
        studentGuide:
          '"Here\'s what we can do: I\'ll verify submission status and payer reference number, then call you back once we have an update — usually within one to two business days from the payer."',
        caller:
          "If you can call me when you hear from the payer, that would mean a lot. My cell is the number on file.",
      },
    ),
    ...stepScript(
      "moreConcerns",
      "Ask about scheduling or Eligibility.",
      {
        studentGuide:
          '"Is there anything else about your M R I or Insurance I can help with today?"',
        caller: "Not today — just the authorization.",
      },
    ),
    ...stepScript(
      "allAddressed",
      "Confirm callback number and timeframe.",
      {
        studentGuide:
          '"We\'ll use the cell number on file and call you when we have payer news. Does that work for you?"',
        caller:
          "Yes, that covers what I needed. Thank you for listening.",
      },
    ),
    ...stepScript(
      "closing",
      "Thank them for patience.",
      {
        studentGuide:
          '"Thank you for calling Lakeside Orthopedics and for your patience. We\'re on this with you. Take care."',
        caller: "Thanks again. Goodbye.",
      },
    ),
  ],
};
