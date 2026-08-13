import { z } from "zod";
import { experienceLevels, referralSources } from "@/content/site";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export const registerAccountSchema = z
  .object({
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    email: z.string().email("Please enter a valid email address."),
    mobile: z
      .string()
      .min(10, "Please enter a valid mobile number.")
      .regex(/^[0-9+\-\s()]+$/, "Please enter a valid mobile number."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Please confirm your password."),
    occupation: z.string().optional(),
    experienceLevel: z.enum(experienceLevels).optional(),
    messengerName: z.string().optional(),
    referralSource: z.enum(referralSources).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type RegisterAccountValues = z.infer<typeof registerAccountSchema>;
