export const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
] as const;

export const PRACTICE_DB_NAME = "bisayamedva-practice-v1";
export const PRACTICE_DB_VERSION = 3;
export const PRACTICE_SCHEMA_VERSION = 3;

export const SCHEDULING_CLINIC_START_HOUR = 8;
export const SCHEDULING_CLINIC_END_HOUR = 17;
export const SCHEDULING_PIXELS_PER_HOUR = 60;

export const PRACTICE_PROVIDERS = [
  "Dr. Elena Reyes, MD",
  "Dr. Michael Chen, MD",
  "Jordan Walsh, NP",
  "Dr. Amara Okonkwo, MD",
] as const;

export const PRACTICE_VISIT_TYPES = [
  "New patient",
  "Follow-up",
  "Annual wellness",
  "Sick visit",
  "Procedure consult",
] as const;

export const PRACTICE_APPOINTMENT_DURATIONS = [15, 30, 45, 60] as const;

export const PRACTICE_APPOINTMENT_LOCATIONS = [
  "Office",
  "Telehealth",
] as const;
