import { getResendClient, getResendFromEmail } from "@/lib/email/resend-client";
import {
  passwordResetEmailSubject,
  renderPasswordResetEmailHtml,
  renderPasswordResetEmailText,
} from "@/lib/email/templates/password-reset-email";

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
  siteUrl?: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    return { ok: false as const, error: "RESEND_API_KEY is not configured." };
  }

  const subject = passwordResetEmailSubject();
  const content = {
    resetUrl: input.resetUrl,
    siteUrl: input.siteUrl,
  };

  const { data, error } = await resend.emails.send({
    from: getResendFromEmail(),
    to: [input.to],
    subject,
    html: renderPasswordResetEmailHtml(content),
    text: renderPasswordResetEmailText(content),
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const, id: data?.id };
}
