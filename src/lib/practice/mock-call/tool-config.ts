import type { CallFlowStepId } from "@/lib/practice/call-flow";
import type { MockCallDialogueToolKey } from "@/lib/practice/mock-call/dialogue-flow";

export type MockCallToolId =
  | "schedule"
  | "patientAccount"
  | "claimStatus"
  | "insurancePrimary"
  | "eligibility"
  | "priorAuth";

export type MockCallToolClickStep = {
  id: string;
  label: string;
};

export type MockCallScheduleWeekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

export type MockCallScheduleSlotCell = {
  weekday: MockCallScheduleWeekday;
  time: string;
  status: "open" | "booked";
  /** Matches VA script — either offered slot completes selectSlot. */
  offerSlot?: boolean;
};

export type MockCallSchedulePatientKey = "janeDoe" | "mariaSantos";

export type MockCallScheduleFixture = {
  patientKey: MockCallSchedulePatientKey;
  weekLabel: string;
  focusWeekday: MockCallScheduleWeekday;
  days: MockCallScheduleWeekday[];
  slots: MockCallScheduleSlotCell[];
  appointmentType?: string;
  providerLabel?: string;
};

export type MockCallToolConfig = {
  toolId: MockCallToolId;
  title: string;
  intro: string;
  clicks: MockCallToolClickStep[];
  scheduleFixture?: MockCallScheduleFixture;
};

const SCHEDULE_CLICKS: MockCallToolClickStep[] = [
  { id: "openSchedule", label: "Click Schedule sa left menu" },
  { id: "searchPatient", label: "Click Patient search / lookup" },
  { id: "selectSlot", label: "Click an open time slot" },
  { id: "saveAppt", label: "Click Save appointment" },
];

const SCHEDULE_LOOKUP_CLICKS: MockCallToolClickStep[] = [
  { id: "openSchedule", label: "Click Schedule sa left menu" },
  {
    id: "searchPatient",
    label: "Search Jane Doe sa patient lookup (type name, then click row)",
  },
];

const BASIC_TRAINING_SCHEDULE: MockCallScheduleFixture = {
  patientKey: "janeDoe",
  weekLabel: "Week of Sep 22, 2026",
  focusWeekday: "Mon",
  days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  appointmentType: "Follow-up",
  providerLabel: "Dr. Lee — Family Med",
  slots: [
    { weekday: "Mon", time: "9:30 AM", status: "open", offerSlot: true },
    { weekday: "Mon", time: "10:00 AM", status: "open", offerSlot: true },
    { weekday: "Mon", time: "11:00 AM", status: "booked" },
    { weekday: "Mon", time: "2:00 PM", status: "booked" },
    { weekday: "Tue", time: "9:00 AM", status: "booked" },
    { weekday: "Tue", time: "1:00 PM", status: "booked" },
    { weekday: "Wed", time: "10:30 AM", status: "booked" },
    { weekday: "Thu", time: "3:00 PM", status: "booked" },
    { weekday: "Fri", time: "8:30 AM", status: "booked" },
  ],
};

const RESCHEDULE_APPOINTMENT_SCHEDULE: MockCallScheduleFixture = {
  patientKey: "janeDoe",
  weekLabel: "Week of Sep 22, 2026",
  focusWeekday: "Wed",
  days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  appointmentType: "Follow-up — office",
  providerLabel: "Dr. Lee — Family Med",
  slots: [
    { weekday: "Mon", time: "9:00 AM", status: "booked" },
    { weekday: "Mon", time: "2:00 PM", status: "booked" },
    { weekday: "Tue", time: "4:00 PM", status: "open", offerSlot: true },
    { weekday: "Tue", time: "10:00 AM", status: "booked" },
    { weekday: "Wed", time: "2:00 PM", status: "open", offerSlot: true },
    { weekday: "Wed", time: "9:30 AM", status: "booked" },
    { weekday: "Thu", time: "11:00 AM", status: "booked" },
    { weekday: "Fri", time: "3:30 PM", status: "booked" },
  ],
};

const PATIENT_ACCOUNT_CLICKS: MockCallToolClickStep[] = [
  { id: "openAccount", label: "Open patient account / chart" },
  { id: "claimsTab", label: "Click Claims or Billing tab" },
  { id: "viewBalance", label: "Click the claim row to view balance detail" },
];

const CLAIM_STATUS_CLICKS: MockCallToolClickStep[] = [
  { id: "patientSearch", label: "Search patient by name or MRN" },
  { id: "openClaim", label: "Open the lab claim from the list" },
  { id: "noteStatus", label: "Add note: pending payer / hold collections" },
];

const INSURANCE_PRIMARY_CLICKS: MockCallToolClickStep[] = [
  { id: "demographics", label: "Open Demographics or Registration" },
  { id: "primaryIns", label: "Click Primary Insurance section" },
  { id: "updatePayer", label: "Update payer to Blue Cross (simulated)" },
  { id: "saveIns", label: "Click Save" },
];

const ELIGIBILITY_CLICKS: MockCallToolClickStep[] = [
  { id: "openElig", label: "Open Eligibility / Benefits" },
  { id: "runCheck", label: "Click Run Eligibility" },
  { id: "saveNote", label: "Save note to patient account" },
];

const PRIOR_AUTH_CLICKS: MockCallToolClickStep[] = [
  { id: "authQueue", label: "Open Prior Authorization queue" },
  { id: "openOrder", label: "Open the M R I order row" },
  { id: "logFollowUp", label: "Log follow-up / callback note" },
];

type ToolMapKey = `${string}:${CallFlowStepId}`;

const TOOL_BY_SCENARIO_STEP: Record<ToolMapKey, MockCallToolConfig> = {
  "basic-call-flow-training:opening": {
    toolId: "schedule",
    title: "Scheduling — patient lookup",
    intro:
      "Caller said Jane Doe — search sa Schedule module while you verify name ug DOB on the phone.",
    clicks: SCHEDULE_LOOKUP_CLICKS,
    scheduleFixture: {
      patientKey: "janeDoe",
      weekLabel: "Week of Sep 22, 2026",
      focusWeekday: "Mon",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      slots: [],
    },
  },
  "basic-call-flow-training:solution": {
    toolId: "schedule",
    title: "Scheduling — reschedule visit",
    intro:
      "Open times sa screen = imong offer sa phone (Monday 9:30 or 10:00). Simulation lang — follow the numbered guide.",
    clicks: SCHEDULE_CLICKS,
    scheduleFixture: BASIC_TRAINING_SCHEDULE,
  },
  "reschedule-appointment:solution": {
    toolId: "schedule",
    title: "Scheduling — move appointment",
    intro:
      "Offer Wed 2:00 p.m. or Tue 4:00 p.m. — open slots sa calendar match sa script. Find patient while on the call.",
    clicks: SCHEDULE_CLICKS,
    scheduleFixture: RESCHEDULE_APPOINTMENT_SCHEDULE,
  },
  "balance-inquiry:solution": {
    toolId: "patientAccount",
    title: "Patient account — claim & balance",
    intro:
      "Practice opening the account while you explain claim review on the call.",
    clicks: PATIENT_ACCOUNT_CLICKS,
  },
  "claim-status-follow-up:solution": {
    toolId: "claimStatus",
    title: "Claim status lookup",
    intro: "Simulation — locate the lab claim while you speak with the patient.",
    clicks: CLAIM_STATUS_CLICKS,
  },
  "wrong-insurance-on-file:solution": {
    toolId: "insurancePrimary",
    title: "Update primary Insurance",
    intro:
      "Practice chart clicks while you confirm new payer details on the phone.",
    clicks: INSURANCE_PRIMARY_CLICKS,
  },
  "eligibility-benefits-check:solution": {
    toolId: "eligibility",
    title: "Eligibility check",
    intro:
      "Fake Eligibility workflow — run check while you set expectations with the caller.",
    clicks: ELIGIBILITY_CLICKS,
  },
  "prior-auth-delay:solution": {
    toolId: "priorAuth",
    title: "Prior authorization queue",
    intro:
      "Simulation — queue navigation while you promise follow-up on the call.",
    clicks: PRIOR_AUTH_CLICKS,
  },
};

export function getMockCallToolConfig(
  scenarioId: string,
  stepId: CallFlowStepId,
): MockCallToolConfig | null {
  const key = `${scenarioId}:${stepId}` as ToolMapKey;
  return TOOL_BY_SCENARIO_STEP[key] ?? null;
}

const DIALOGUE_TOOL_CONFIG: Record<
  MockCallDialogueToolKey,
  MockCallToolConfig
> = {
  chartLookup: {
    toolId: "schedule",
    title: "Scheduling — patient lookup",
    intro:
      "Pull up Jane Doe sa Schedule while you confirm details on the phone.",
    clicks: SCHEDULE_LOOKUP_CLICKS,
    scheduleFixture: {
      patientKey: "janeDoe",
      weekLabel: "Week of Sep 22, 2026",
      focusWeekday: "Mon",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      slots: [],
    },
  },
  scheduleBrowse: {
    toolId: "schedule",
    title: "Scheduling — Monday open slots",
    intro:
      "Browse Monday 9:30 ug 10:00 — match sa imong offer before you speak the times aloud.",
    clicks: [
      { id: "openSchedule", label: "Click Schedule sa left menu" },
      { id: "searchPatient", label: "Click Jane Doe sa patient lookup" },
    ],
    scheduleFixture: BASIC_TRAINING_SCHEDULE,
  },
  scheduleBook10: {
    toolId: "schedule",
    title: "Scheduling — book Monday 10:00 a.m.",
    intro:
      "Select Monday ten a.m. ug Save appointment before Next step — required sa training.",
    clicks: SCHEDULE_CLICKS,
    scheduleFixture: BASIC_TRAINING_SCHEDULE,
  },
};

export function getMockCallToolConfigByDialogueKey(
  toolKey: MockCallDialogueToolKey,
): MockCallToolConfig {
  return DIALOGUE_TOOL_CONFIG[toolKey];
}
