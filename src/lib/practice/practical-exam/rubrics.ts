export type PracticalScenarioQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string; correct: boolean; critical?: boolean }[];
};

export const CALL_MED_ADVICE_OPTIONS = [
  {
    id: "give_dose_advice",
    label: "Tell them to take another dose if pain continues.",
    correct: false,
    critical: true,
  },
  {
    id: "route_clinical",
    label: "Recognize a clinical question, stay within your role, and route to the clinical team per clinic workflow.",
    correct: true,
  },
  {
    id: "google_it",
    label: "Search online and share what you find.",
    correct: false,
    critical: true,
  },
  {
    id: "ignore",
    label: "End the call — not your job.",
    correct: false,
  },
] as const;

export const CALL_UPSET_OPTIONS = [
  {
    id: "argue",
    label: "Explain that the clinic is busy and they need to wait.",
    correct: false,
  },
  {
    id: "listen_framework",
    label: "Listen, validate frustration, investigate what happened, set a realistic next step, and confirm follow-up.",
    correct: true,
  },
  {
    id: "promise_today",
    label: "Promise someone will call them back within the hour no matter what.",
    correct: false,
    critical: true,
  },
  {
    id: "transfer_blame",
    label: "Tell them another department should have handled it.",
    correct: false,
  },
] as const;

export const ADMIN_SCENARIO_QUESTIONS: PracticalScenarioQuestion[] = [
  {
    id: "conflicting_phone",
    prompt:
      "A patient gives a phone number on a call, but the chart shows a different number. What do you do first?",
    options: [
      { id: "overwrite", label: "Replace the chart number immediately.", correct: false, critical: true },
      { id: "verify", label: "Verify identity, compare, confirm the correct number, then update and document per workflow.", correct: true },
      { id: "ignore_new", label: "Keep the old number — charts are always right.", correct: false },
      { id: "both", label: "Save both numbers without noting which is primary.", correct: false },
    ],
  },
  {
    id: "duplicate_chart",
    prompt:
      'A new patient says they have never been to the clinic, but you find a similar name and DOB. What next?',
    options: [
      { id: "create_new", label: "Create a new chart right away.", correct: false, critical: true },
      { id: "search_verify", label: "Search, verify identity, then create only if it is truly a new patient.", correct: true },
      { id: "merge", label: "Merge charts without asking anyone.", correct: false },
      { id: "skip", label: "Skip registration.", correct: false },
    ],
  },
  {
    id: "medication_message",
    prompt: 'Patient message: "Should I take two pills instead of one?"',
    options: [
      { id: "two_pills", label: "If it sounds reasonable, tell them two is fine.", correct: false, critical: true },
      { id: "route", label: "Recognize medication instruction is clinical — route per workflow, do not guess.", correct: true },
      { id: "google", label: "Look up the drug online and reply.", correct: false, critical: true },
      { id: "ignore_msg", label: "Ignore — not urgent.", correct: false },
    ],
  },
  {
    id: "pending_form",
    prompt:
      'A patient asks if anyone reviewed their form from three days ago. You are not sure.',
    options: [
      { id: "yes_sure", label: 'Say "Yes, someone is on it" to keep them calm.', correct: false, critical: true },
      { id: "check_status", label: "Check status, give an honest update, and follow routing/follow-up process.", correct: true },
      { id: "promise_today", label: "Promise a callback today without checking.", correct: false },
      { id: "no_update", label: "Say there is no form on file without searching.", correct: false },
    ],
  },
  {
    id: "fully_booked",
    prompt: "Patient wants tomorrow; provider is fully booked.",
    options: [
      { id: "book_anyway", label: "Book tomorrow anyway — patient satisfaction first.", correct: false, critical: true },
      { id: "alternatives", label: "Offer next available options, alternatives, and escalation per policy — no fake slots.", correct: true },
      { id: "deny", label: "Say nothing is possible and hang up.", correct: false },
      { id: "other_provider", label: "Book with a random provider without confirming fit.", correct: false },
    ],
  },
  {
    id: "wrong_chart",
    prompt: "You opened the wrong patient chart.",
    options: [
      { id: "keep_going", label: "Continue — no one will notice.", correct: false, critical: true },
      { id: "stop", label: "Stop, close the wrong chart, return to correct workflow, report if required.", correct: true },
      { id: "quick_peek", label: "Finish what you started in that chart.", correct: false, critical: true },
      { id: "delete", label: "Delete the chart.", correct: false },
    ],
  },
  {
    id: "dob_mismatch",
    prompt: "Chart DOB does not match what you are working with.",
    options: [
      { id: "fix_now", label: "Change DOB immediately to match your notes.", correct: false, critical: true },
      { id: "verify_first", label: "Verify with patient/authorized source before any demographic change.", correct: true },
      { id: "ignore_dob", label: "Ignore — close enough.", correct: false },
      { id: "ask_friend", label: "Ask a coworker to guess.", correct: false },
    ],
  },
  {
    id: "provider_clinical",
    prompt: "Provider asks you to decide a clinical patient situation on your own.",
    options: [
      { id: "decide", label: "Make the clinical decision — save the provider time.", correct: false, critical: true },
      { id: "boundary", label: "Stay in admin scope; route clinical judgment to the provider/clinical team.", correct: true },
      { id: "patient", label: "Ask the patient what to do clinically.", correct: false, critical: true },
      { id: "delay", label: "Ignore the message.", correct: false },
    ],
  },
];

export const MISTAKE_HANDLING_OPTIONS = [
  {
    id: "hide",
    label: "Fix it quietly and hope no one notices.",
    correct: false,
    critical: true,
  },
  {
    id: "assess_own",
    label: "Assess what happened, follow reporting process, communicate, and correct safely.",
    correct: true,
  },
  {
    id: "blame_patient",
    label: "Blame the patient or system.",
    correct: false,
  },
  {
    id: "wait",
    label: "Wait until end of month to mention it.",
    correct: false,
  },
] as const;

export const PRACTICAL_PASS_SCORE = 80;
