import { site } from "@/content/site";

export function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export type AnnouncementEmailContent = {
  title: string;
  bodyPlain: string;
  recipientName?: string | null;
  siteUrl?: string;
  logoUrl?: string;
  ctaUrl?: string;
  supportEmail?: string;
};

function firstName(fullName: string | null | undefined) {
  if (!fullName?.trim()) return null;
  return fullName.trim().split(/\s+/)[0] ?? null;
}

function defaults(input: AnnouncementEmailContent) {
  const siteUrl = (input.siteUrl ?? site.url).replace(/\/$/, "");
  return {
    siteUrl,
    logoUrl:
      input.logoUrl ?? `${siteUrl}/images/brand/logo-on-light.png`,
    ctaUrl: input.ctaUrl ?? `${siteUrl}/member`,
    supportEmail: input.supportEmail ?? site.email,
    greeting: firstName(input.recipientName),
  };
}

export function renderAnnouncementEmailHtml(input: AnnouncementEmailContent) {
  const { siteUrl, logoUrl, ctaUrl, supportEmail, greeting } = defaults(input);
  const title = escapeHtml(input.title);
  const body = escapeHtml(input.bodyPlain);
  const greetingLine = greeting
    ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#2f3826;">Hi ${escapeHtml(greeting)},</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f5eb;font-family:Georgia,'Times New Roman',Times,serif;-webkit-font-smoothing:antialiased;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f5eb;">
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
<tr>
<td align="center" style="background-color:#5b6d49;border-radius:12px 12px 0 0;padding:28px 24px;">
<a href="${escapeHtml(siteUrl)}" style="text-decoration:none;">
<img src="${escapeHtml(logoUrl)}" alt="Bisaya MedVA" width="168" style="display:block;border:0;max-width:168px;height:auto;" />
</a>
</td>
</tr>
<tr>
<td style="background-color:#ffffff;border-left:1px solid #e8ebe0;border-right:1px solid #e8ebe0;padding:32px 28px;">
<p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#5b6d49;">Announcement</p>
<h1 style="margin:0 0 24px;font-size:22px;line-height:1.35;font-weight:600;color:#2f3826;font-family:Georgia,'Times New Roman',Times,serif;">${title}</h1>
${greetingLine}
<div style="font-size:15px;line-height:1.65;color:#2f3826;white-space:pre-wrap;font-family:Georgia,'Times New Roman',Times,serif;">${body}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;">
<tr>
<td align="center" style="border-radius:8px;background-color:#5b6d49;">
<a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Open My training</a>
</td>
</tr>
</table>
<p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#6b7280;">Or open the bell icon in My training to read this anytime.</p>
</td>
</tr>
<tr>
<td style="background-color:#eef1e4;border:1px solid #e8ebe0;border-top:none;border-radius:0 0 12px 12px;padding:24px 28px;">
<p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#6b7280;text-align:center;">Bisaya MedVA · Medical VA Training</p>
<p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#6b7280;text-align:center;"><a href="mailto:${escapeHtml(supportEmail)}" style="color:#5b6d49;text-decoration:none;">${escapeHtml(supportEmail)}</a></p>
<p style="margin:0;font-size:11px;line-height:1.5;color:#9ca3af;text-align:center;">You received this because you are enrolled with Bisaya MedVA.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

export function renderAnnouncementEmailText(input: AnnouncementEmailContent) {
  const { ctaUrl, supportEmail, greeting } = defaults(input);
  const lines = [
    "Bisaya MedVA — Announcement",
    "",
    input.title,
    "",
  ];
  if (greeting) lines.push(`Hi ${greeting},`, "");
  lines.push(input.bodyPlain, "", "Open My training:", ctaUrl, "");
  lines.push(
    "---",
    "Bisaya MedVA · Medical VA Training",
    supportEmail,
    "You received this because you are enrolled with Bisaya MedVA.",
  );
  return lines.join("\n");
}
