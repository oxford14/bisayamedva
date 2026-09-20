import type { PracticePatientFormValues } from "@/lib/practice/patient-schema";

/** Case 01 — Emily Carter (fictional). First name includes Grace per chart intake. */
export const EXAM_CASE_PATIENT = {
  legalFirstName: "Emily Grace",
  legalMiddleName: "Marie",
  legalLastName: "Carter",
  dateOfBirth: "1989-04-15",
} as const;

export function formatExamCaseDob(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/** Case 01 — Emily Carter (fictional). */
export const EXAM_REGISTRATION_GOLDEN: PracticePatientFormValues = {
  legalFirstName: EXAM_CASE_PATIENT.legalFirstName,
  legalMiddleName: EXAM_CASE_PATIENT.legalMiddleName,
  legalLastName: EXAM_CASE_PATIENT.legalLastName,
  dateOfBirth: "1989-04-15",
  sexAtBirth: "Female",
  phone: "(612) 555-0184",
  email: "emily.carter@example.com",
  addressLine1: "2458 Lakeview Drive",
  addressLine2: "",
  city: "Minneapolis",
  state: "Minnesota",
  zip: "55416",
  emergencyContactName: "Daniel Carter",
  emergencyContactPhone: "(612) 555-0142",
  emergencyContactRelationship: "Spouse",
  insurancePayer: "Blue Cross Blue Shield of Minnesota",
  insuranceMemberId: "ABC123456789",
  insuranceGroupNumber: "GRP45678",
  subscriberRelationship: "Self",
  notes: "",
};

export const EXAM_SCHEDULING_REQUEST = {
  patientName: "Maria Santos",
  provider: "Dr. James Miller",
  visitType: "Follow-up",
  preferredDate: "2026-09-22",
  preferredWindow: "Morning",
} as const;

export const EXAM_SCHEDULING_SLOTS = [
  {
    id: "slot-2026-09-22-0900",
    date: "2026-09-22",
    time: "09:00",
    label: "Sep 22, 2026 · 9:00 AM",
    provider: "Dr. James Miller",
    location: "Main Clinic",
  },
  {
    id: "slot-2026-09-22-1400",
    date: "2026-09-22",
    time: "14:00",
    label: "Sep 22, 2026 · 2:00 PM",
    provider: "Dr. James Miller",
    location: "Main Clinic",
  },
  {
    id: "slot-2026-09-23-0900",
    date: "2026-09-23",
    time: "09:00",
    label: "Sep 23, 2026 · 9:00 AM",
    provider: "Dr. James Miller",
    location: "Main Clinic",
  },
] as const;

export const EXAM_VALID_SCHEDULING = {
  patientName: "Maria Santos",
  provider: "Dr. James Miller",
  visitType: "Follow-up",
  date: "2026-09-22",
  time: "09:00",
  location: "Main Clinic",
};

export const PRIORITY_TASKS = [
  { id: "A", label: "Patient waiting on the phone" },
  { id: "B", label: "Appointment request for today" },
  { id: "C", label: "Client spreadsheet update" },
  { id: "D", label: "Provider message" },
  { id: "E", label: "Unfinished task from yesterday" },
  { id: "F", label: 'Client message: "ASAP — please take care of this."' },
] as const;

/** Ideal first-three emphasis: phone, same-day appointment, then provider message. */
export const PRIORITY_IDEAL_ORDER = ["A", "B", "D", "E", "F", "C"] as const;
