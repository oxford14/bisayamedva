import {
  validatePracticePatient,
  type PracticePatientFormValues,
  type PracticePatientSchedulingQuickValues,
} from "@/lib/practice/patient-schema";
import { createEmptyPatient } from "@/lib/practice/seed";
import type { PracticePatient } from "@/lib/practice/types";

/** Simulation-only defaults for fields not collected in scheduling quick-add. */
function schedulingQuickAddDefaults(
  quick: PracticePatientSchedulingQuickValues,
): Omit<PracticePatientFormValues, keyof PracticePatientSchedulingQuickValues> {
  const slug = `${quick.legalFirstName}.${quick.legalLastName}`
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "")
    .slice(0, 40);
  return {
    email: `${slug || "patient"}.demo@example.com`,
    addressLine1: "123 Practice Lane",
    addressLine2: "",
    city: "Austin",
    state: "TX",
    zip: "78701",
    emergencyContactName: `${quick.legalFirstName} ${quick.legalLastName}`.trim(),
    emergencyContactPhone: quick.phone,
    emergencyContactRelationship: "Self",
    insurancePayer: "Self-pay (simulation)",
    insuranceMemberId: `SIM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    insuranceGroupNumber: "SIM-GRP",
    subscriberRelationship: "Self",
    notes:
      "Added from scheduling sim — open Patient registration if you want full intake fields.",
  };
}

export function buildRegisteredPatientFromQuickAdd(
  quick: PracticePatientSchedulingQuickValues,
  base?: PracticePatient,
): PracticePatient {
  const patient = base ?? createEmptyPatient();
  const defaults = schedulingQuickAddDefaults(quick);
  return {
    ...patient,
    ...quick,
    ...defaults,
    status: "registered",
  };
}

export function prepareRegisteredPatientFromSchedulingQuickAdd(
  quick: PracticePatientSchedulingQuickValues,
  base?: PracticePatient,
):
  | { ok: true; patient: PracticePatient }
  | { ok: false; fieldErrors: Record<string, string> } {
  const patient = buildRegisteredPatientFromQuickAdd(quick, base);
  const formValues: PracticePatientFormValues = {
    legalFirstName: patient.legalFirstName,
    legalMiddleName: patient.legalMiddleName,
    legalLastName: patient.legalLastName,
    dateOfBirth: patient.dateOfBirth,
    sexAtBirth: patient.sexAtBirth,
    phone: patient.phone,
    email: patient.email,
    addressLine1: patient.addressLine1,
    addressLine2: patient.addressLine2,
    city: patient.city,
    state: patient.state,
    zip: patient.zip,
    emergencyContactName: patient.emergencyContactName,
    emergencyContactPhone: patient.emergencyContactPhone,
    emergencyContactRelationship: patient.emergencyContactRelationship,
    insurancePayer: patient.insurancePayer,
    insuranceMemberId: patient.insuranceMemberId,
    insuranceGroupNumber: patient.insuranceGroupNumber,
    subscriberRelationship: patient.subscriberRelationship,
    notes: patient.notes,
  };
  const parsed = validatePracticePatient(formValues, "registered");
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === "string" && !fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }
    return { ok: false, fieldErrors };
  }
  return {
    ok: true,
    patient: {
      ...patient,
      ...parsed.data,
      state: parsed.data.state || "",
    },
  };
}
