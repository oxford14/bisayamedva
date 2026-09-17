export const PM_APP_NAME = "Riverside PM";

export const pmPatients = {
  mariaSantos: {
    id: "maria",
    name: "Maria Santos",
    mrn: "MRN-10482",
    dob: "08/14/1972",
    searchLabel: "Maria Santos — MRN 10482 — DOB 08/14/1972",
  },
  janeDoe: {
    id: "jane",
    name: "Jane Doe",
    mrn: "MRN-22019",
    dob: "04/12/1985",
    searchLabel: "Jane Doe — MRN 22019 — DOB 04/12/1985",
  },
  wrongPatient: {
    id: "other",
    name: "Robert Chen",
    mrn: "MRN-99102",
    dob: "01/03/1960",
    searchLabel: "Robert Chen — MRN 99102",
  },
} as const;

export const pmClaims = {
  balanceMarch12: {
    id: "claim-mar12",
    dos: "03/12/2026",
    description: "Office visit — Claim pending",
    status: "Pending payer",
    patientBalance: "$240.00",
  },
  lab8842: {
    id: "claim-8842",
    claimNumber: "8842",
    dos: "04/08/2026",
    description: "Lab — CBC panel",
    status: "Pending payer",
  },
} as const;

export const pmPayers = {
  blueCross: "Blue Cross PPO",
  aetna: "Aetna HMO",
} as const;

export const pmNavModules = [
  { id: "schedule", label: "Schedule" },
  { id: "patients", label: "Patients" },
  { id: "billing", label: "Billing" },
  { id: "claims", label: "Claims" },
  { id: "auth", label: "Prior Auth" },
  { id: "eligibility", label: "Eligibility" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
] as const;

export type PmNavModuleId = (typeof pmNavModules)[number]["id"];
