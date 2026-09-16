import type { PracticePatient } from "@/lib/practice/types";

/** Stable demo patient IDs for local practice storage re-seeds. */
export const SEED_PATIENT_IDS = {
  mariaSantos: "a1000000-0000-4000-8000-000000000001",
  jamesMiller: "a1000000-0000-4000-8000-000000000002",
  priyaPatel: "a1000000-0000-4000-8000-000000000003",
} as const;

function nowIso() {
  return new Date().toISOString();
}

function seedPatient(
  partial: Omit<PracticePatient, "createdAt" | "updatedAt">,
): PracticePatient {
  const ts = nowIso();
  return { ...partial, createdAt: ts, updatedAt: ts };
}

export function createSeedPatients(): PracticePatient[] {
  return [
    seedPatient({
      id: SEED_PATIENT_IDS.mariaSantos,
      status: "registered",
      legalFirstName: "Maria",
      legalMiddleName: "L.",
      legalLastName: "Santos",
      dateOfBirth: "1988-04-12",
      sexAtBirth: "Female",
      phone: "(555) 401-8822",
      email: "maria.santos.demo@example.com",
      addressLine1: "1200 Oak Ridge Dr",
      addressLine2: "Apt 4B",
      city: "Austin",
      state: "TX",
      zip: "78701",
      emergencyContactName: "Juan Santos",
      emergencyContactPhone: "(555) 401-9900",
      emergencyContactRelationship: "Spouse",
      insurancePayer: "Blue Cross Blue Shield of Texas",
      insuranceMemberId: "XYZ882211004",
      insuranceGroupNumber: "GRP-44821",
      subscriberRelationship: "Self",
      notes: "Demo patient — simulation only.",
    }),
    seedPatient({
      id: SEED_PATIENT_IDS.jamesMiller,
      status: "draft",
      legalFirstName: "James",
      legalMiddleName: "",
      legalLastName: "Miller",
      dateOfBirth: "1975-11-03",
      sexAtBirth: "Male",
      phone: "(555) 220-1144",
      email: "james.miller.demo@example.com",
      addressLine1: "88 Pine Street",
      addressLine2: "",
      city: "Columbus",
      state: "OH",
      zip: "43215",
      emergencyContactName: "Emily Miller",
      emergencyContactPhone: "(555) 220-1188",
      emergencyContactRelationship: "Daughter",
      insurancePayer: "Aetna",
      insuranceMemberId: "",
      insuranceGroupNumber: "",
      subscriberRelationship: "Self",
      notes: "Incomplete insurance — finish for registration practice.",
    }),
    seedPatient({
      id: SEED_PATIENT_IDS.priyaPatel,
      status: "registered",
      legalFirstName: "Priya",
      legalMiddleName: "K.",
      legalLastName: "Patel",
      dateOfBirth: "1992-07-22",
      sexAtBirth: "Female",
      phone: "(555) 330-7711",
      email: "priya.patel.demo@example.com",
      addressLine1: "500 Market St",
      addressLine2: "Suite 210",
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      emergencyContactName: "Ravi Patel",
      emergencyContactPhone: "(555) 330-7722",
      emergencyContactRelationship: "Brother",
      insurancePayer: "UnitedHealthcare",
      insuranceMemberId: "UHC992044881",
      insuranceGroupNumber: "SF-MED-12",
      subscriberRelationship: "Self",
      notes: "Demo — Eligibility check practice.",
    }),
  ];
}

export function createEmptyPatient(): PracticePatient {
  const ts = nowIso();
  return {
    id: crypto.randomUUID(),
    status: "draft",
    legalFirstName: "",
    legalMiddleName: "",
    legalLastName: "",
    dateOfBirth: "",
    sexAtBirth: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zip: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    insurancePayer: "",
    insuranceMemberId: "",
    insuranceGroupNumber: "",
    subscriberRelationship: "Self",
    notes: "",
    createdAt: ts,
    updatedAt: ts,
  };
}
