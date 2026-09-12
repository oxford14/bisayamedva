import { getResendClient, getResendFromEmail } from "@/lib/email/resend-client";
import {
  renderAnnouncementEmailHtml,
  renderAnnouncementEmailText,
} from "@/lib/email/templates/announcement-email";

export async function sendAnnouncementEmail(input: {
  to: string;
  subject: string;
  bodyPlain: string;
  announcementId: string;
  userId: string;
  recipientName?: string | null;
}) {
  const resend = getResendClient();
  if (!resend) {
    return { ok: false as const, error: "RESEND_API_KEY is not configured." };
  }

  const content = {
    title: input.subject,
    bodyPlain: input.bodyPlain,
    recipientName: input.recipientName,
  };

  const { data, error } = await resend.emails.send(
    {
      from: getResendFromEmail(),
      to: [input.to],
      subject: input.subject,
      html: renderAnnouncementEmailHtml(content),
      text: renderAnnouncementEmailText(content),
    },
    {
      idempotencyKey: `announcement-email/${input.announcementId}/${input.userId}`,
    },
  );

  if (error) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const, id: data?.id };
}

export async function sendAnnouncementEmailsToRecipients(input: {
  announcementId: string;
  title: string;
  bodyPlain: string;
  recipients: {
    userId: string;
    email: string;
    fullName?: string | null;
  }[];
}) {
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of input.recipients) {
    const result = await sendAnnouncementEmail({
      to: recipient.email,
      subject: input.title,
      bodyPlain: input.bodyPlain,
      announcementId: input.announcementId,
      userId: recipient.userId,
      recipientName: recipient.fullName,
    });
    if (!result.ok) {
      failed += 1;
      if (errors.length < 3) errors.push(result.error);
    }
  }

  return {
    sent: input.recipients.length - failed,
    failed,
    errors,
  };
}
