import { site } from "@/content/site";
import { escapeHtml } from "@/lib/email/templates/announcement-email";

export type PasswordResetEmailContent = {
  resetUrl: string;
  siteUrl?: string;
  logoUrl?: string;
  supportEmail?: string;
};

function defaults(input: PasswordResetEmailContent) {
  const siteUrl = (input.siteUrl ?? site.url).replace(/\/$/, "");
  return {
    siteUrl,
    logoUrl:
      input.logoUrl ?? `${siteUrl}/images/brand/logo-on-light.png`,
    supportEmail: input.supportEmail ?? site.email,
    resetUrl: input.resetUrl,
  };
}

export function passwordResetEmailSubject() {
  return "Reset your Bisaya MedVA password";
}

export function renderPasswordResetEmailHtml(input: PasswordResetEmailContent) {
  const { siteUrl, logoUrl, supportEmail, resetUrl } = defaults(input);
  const body =
    "Naa mi request nga i-reset ang imong password. Click the button below para mag-set og bag-ong password. Kung wala ka mag-request, pwede nimo i-ignore ni nga email.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(passwordResetEmailSubject())}</title>
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
<p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#5b6d49;">Password reset</p>
<h1 style="margin:0 0 24px;font-size:22px;line-height:1.35;font-weight:600;color:#2f3826;font-family:Georgia,'Times New Roman',Times,serif;">Reset your password</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#2f3826;">${escapeHtml(body)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
<tr>
<td align="center" style="border-radius:8px;background-color:#5b6d49;">
<a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Reset password</a>
</td>
</tr>
</table>
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6b7280;">This link expires after a short time. If the button does not work, copy and paste this URL into your browser:</p>
<p style="margin:8px 0 0;font-size:12px;line-height:1.5;word-break:break-all;"><a href="${escapeHtml(resetUrl)}" style="color:#5b6d49;">${escapeHtml(resetUrl)}</a></p>
</td>
</tr>
<tr>
<td style="background-color:#eef1e4;border:1px solid #e8ebe0;border-top:none;border-radius:0 0 12px 12px;padding:24px 28px;">
<p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#6b7280;text-align:center;">Bisaya MedVA · Medical VA Training</p>
<p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#6b7280;text-align:center;"><a href="mailto:${escapeHtml(supportEmail)}" style="color:#5b6d49;text-decoration:none;">${escapeHtml(supportEmail)}</a></p>
<p style="margin:0;font-size:11px;line-height:1.5;color:#9ca3af;text-align:center;">You received this because a password reset was requested for your Bisaya MedVA account.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

export function renderPasswordResetEmailText(input: PasswordResetEmailContent) {
  const { supportEmail, resetUrl } = defaults(input);
  return [
    "Bisaya MedVA — Password reset",
    "",
    "Naa mi request nga i-reset ang imong password. Open this link para mag-set og bag-ong password:",
    "",
    resetUrl,
    "",
    "Kung wala ka mag-request, pwede nimo i-ignore ni nga email.",
    "",
    "---",
    "Bisaya MedVA · Medical VA Training",
    supportEmail,
  ].join("\n");
}
