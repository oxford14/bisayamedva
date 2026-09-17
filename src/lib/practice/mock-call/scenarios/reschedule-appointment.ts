import type { MockCallScenario } from "@/lib/practice/mock-call-scenarios";
import {
  MOCK_CALL_STUDENT_NAME_PLACEHOLDER,
  stepScript,
} from "@/lib/practice/mock-call/coach-templates";

export const rescheduleAppointmentScenario: MockCallScenario = {
  id: "reschedule-appointment",
  title: "Reschedule appointment",
  summary:
    "Upbeat caller moving a follow-up — front-desk scheduling flow, reminders, and confirmation.",
  callerMood: "happy",
  lines: [
    ...stepScript(
      "opening",
      "Scheduling calls may sound casual — stay professional.",
      {
        studentGuide: `"Good morning, thank you for calling Riverside Family Medicine. My name is ${MOCK_CALL_STUDENT_NAME_PLACEHOLDER}, Medical VA support. How can I help you today?"`,
        responseGuide:
          '"Happy to help with that reschedule — let me find your appointment and see what we have next week."',
        caller:
          "Hi there! I'd like to reschedule my follow-up appointment if you have time next week.",
      },
    ),
    ...stepScript(
      "rapport",
      "Match their positive energy briefly, then move to details.",
      {
        studentGuide:
          '"That\'s great — I\'d be happy to help with scheduling. How has your day been so far?"',
        caller: "I'm doing great, thanks! Beautiful weather here today.",
      },
    ),
    ...stepScript(
      "mainConcern",
      "Verify patient name, date of birth, current appointment, and provider.",
      {
        studentGuide:
          '"May I confirm your name and date of birth? Then we\'ll look at your Thursday appointment with Dr. Michael Chen and find a Tuesday or Wednesday afternoon that works."',
        caller:
          "It's with Dr. Michael Chen on Thursday at three p.m. I need Tuesday or Wednesday afternoon instead.",
      },
    ),
    ...stepScript(
      "apologyAssurance",
      "Light acknowledgment if they apologize for changing.",
      {
        studentGuide:
          '"No trouble at all — schedules change. Here\'s what we can do: I\'ll find the best alternate slot for you."',
        caller: "Sorry for the last-minute change — my shift schedule moved.",
      },
    ),
    ...stepScript(
      "solution",
      "Offer concrete slots, location, confirmation method.",
      {
        studentGuide:
          '"I have Wednesday at two p.m. in the office, or Tuesday at four p.m. — which do you prefer?"',
        caller:
          "Wednesday at two p.m. in the office works perfectly for me.",
      },
    ),
    ...stepScript(
      "moreConcerns",
      "Ask about reminders or prep.",
      {
        studentGuide:
          '"You\'re set for Wednesday at two p.m. Is there anything else — reminders, portal access, or visit prep?"',
        caller:
          "Will I get a text reminder? That's how I usually remember my visits.",
      },
    ),
    ...stepScript(
      "allAddressed",
      "Confirm date, time, location, reminder channel.",
      {
        studentGuide:
          '"Yes — we\'ll send a text reminder to the number on file. So: Dr. Chen, Wednesday two p.m., office visit. All good?"',
        caller: "Yes, we're all set. Thanks so much!",
      },
    ),
    ...stepScript(
      "closing",
      "Recap and warm goodbye.",
      {
        studentGuide:
          '"Thank you for calling Riverside Family Medicine. We look forward to seeing you Wednesday. Have a wonderful day!"',
        caller: "You too — take care. Bye!",
      },
    ),
  ],
};
