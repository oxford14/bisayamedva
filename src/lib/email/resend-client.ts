import { Resend } from "resend";

let client: Resend | null = null;

export function getResendClient() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export function getResendFromEmail() {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Bisaya MedVA <info@bisayamedva.com>"
  );
}
