import { z } from "zod";
import { US_STATES } from "@/lib/practice/constants";

const zipRegex = /^\d{5}(-\d{4})?$/;

export const practicePatientDraftSchema = z.object({
  legalFirstName: z.string().trim().min(1, "Legal first name is required."),
  legalMiddleName: z.string().trim(),
  legalLastName: z.string().trim().min(1, "Legal last name is required."),
  dateOfBirth: z.string().min(1, "Date of birth is required."),
  sexAtBirth: z.string().trim().min(1, "Sex at birth is required."),
  phone: z.string().trim().min(10, "Phone number is required."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email.")
    .or(z.literal("")),
  addressLine1: z.string().trim(),
  addressLine2: z.string().trim(),
  city: z.string().trim(),
  state: z.string(),
  zip: z.string().trim(),
  emergencyContactName: z.string().trim(),
  emergencyContactPhone: z.string().trim(),
  emergencyContactRelationship: z.string().trim(),
  insurancePayer: z.string().trim(),
  insuranceMemberId: z.string().trim(),
  insuranceGroupNumber: z.string().trim(),
  subscriberRelationship: z.string().trim(),
  notes: z.string().trim(),
});

export const practicePatientRegisteredSchema = practicePatientDraftSchema.extend({
  email: z.string().trim().email("Enter a valid email."),
  addressLine1: z.string().trim().min(1, "Address line 1 is required."),
  city: z.string().trim().min(1, "City is required."),
  state: z.enum(US_STATES, { message: "Select a US state." }),
  zip: z
    .string()
    .trim()
    .regex(zipRegex, "Use a valid US ZIP (12345 or 12345-6789)."),
  emergencyContactName: z
    .string()
    .trim()
    .min(1, "Emergency contact name is required."),
  emergencyContactPhone: z
    .string()
    .trim()
    .min(10, "Emergency contact phone is required."),
  emergencyContactRelationship: z
    .string()
    .trim()
    .min(1, "Emergency contact relationship is required."),
  insurancePayer: z.string().trim().min(1, "Insurance payer is required."),
  insuranceMemberId: z.string().trim().min(1, "Member ID is required."),
  insuranceGroupNumber: z.string().trim().min(1, "Group number is required."),
  subscriberRelationship: z
    .string()
    .trim()
    .min(1, "Subscriber relationship is required."),
});

export type PracticePatientFormValues = z.infer<typeof practicePatientDraftSchema>;

export function validatePracticePatient(
  values: PracticePatientFormValues,
  status: "draft" | "registered",
) {
  const schema =
    status === "registered"
      ? practicePatientRegisteredSchema
      : practicePatientDraftSchema;
  return schema.safeParse(values);
}
