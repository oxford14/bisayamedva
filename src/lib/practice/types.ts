export type PracticePatientStatus = "draft" | "registered";

export type PracticePatient = {
  id: string;
  status: PracticePatientStatus;
  legalFirstName: string;
  legalMiddleName: string;
  legalLastName: string;
  dateOfBirth: string;
  sexAtBirth: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  insurancePayer: string;
  insuranceMemberId: string;
  insuranceGroupNumber: string;
  subscriberRelationship: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type PracticeMetaRecord = {
  key: "owner";
  ownerUserId: string;
  schemaVersion: number;
};

export type PracticeAppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show";

export type PracticeAppointmentLocation = "Office" | "Telehealth";

export type PracticeAppointmentKind = "appointment" | "block";

export type PracticeAppointment = {
  id: string;
  kind: PracticeAppointmentKind;
  patientId: string;
  providerName: string;
  visitType: string;
  location: PracticeAppointmentLocation;
  startsAt: string;
  durationMinutes: number;
  reasonForVisit: string;
  status: PracticeAppointmentStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};
