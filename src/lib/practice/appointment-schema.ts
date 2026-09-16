import { z } from "zod";
import {
  PRACTICE_APPOINTMENT_DURATIONS,
  PRACTICE_APPOINTMENT_LOCATIONS,
  PRACTICE_PROVIDERS,
  PRACTICE_VISIT_TYPES,
} from "@/lib/practice/constants";

const sharedFields = {
  providerName: z.enum(PRACTICE_PROVIDERS, {
    message: "Select a provider.",
  }),
  location: z.enum(PRACTICE_APPOINTMENT_LOCATIONS, {
    message: "Select Office or Telehealth.",
  }),
  startsAt: z
    .string()
    .min(1, "Date and time are required.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Enter a valid date and time.",
    }),
  durationMinutes: z.coerce
    .number()
    .refine(
      (n) =>
        PRACTICE_APPOINTMENT_DURATIONS.includes(
          n as (typeof PRACTICE_APPOINTMENT_DURATIONS)[number],
        ),
      { message: "Select a valid duration." },
    ),
  status: z.enum([
    "scheduled",
    "checked_in",
    "completed",
    "cancelled",
    "no_show",
  ]),
  notes: z.string().trim(),
};

const practiceAppointmentEntrySchema = z.object({
  kind: z.literal("appointment"),
  patientId: z
    .string()
    .min(1, "Select a registered patient.")
    .uuid("Select a registered patient."),
  visitType: z.enum(PRACTICE_VISIT_TYPES, {
    message: "Select a visit type.",
  }),
  reasonForVisit: z
    .string()
    .trim()
    .min(3, "Reason for visit is required (simulation)."),
  ...sharedFields,
});

const practiceBlockEntrySchema = z.object({
  kind: z.literal("block"),
  patientId: z.literal(""),
  visitType: z.string().trim(),
  reasonForVisit: z
    .string()
    .trim()
    .min(3, "Block title or note is required (simulation)."),
  ...sharedFields,
});

export const practiceAppointmentSchema = z.discriminatedUnion("kind", [
  practiceAppointmentEntrySchema,
  practiceBlockEntrySchema,
]);

export type PracticeAppointmentFormValues = z.infer<
  typeof practiceAppointmentSchema
>;

export function validatePracticeAppointment(values: PracticeAppointmentFormValues) {
  return practiceAppointmentSchema.safeParse(values);
}
