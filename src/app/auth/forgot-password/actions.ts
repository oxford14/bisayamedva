"use server";

import { authCopy } from "@/content/site";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset-email";
import { getAppOrigin } from "@/lib/payments/pay-url";
import { createServiceClient } from "@/lib/supabase/admin";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export type ForgotPasswordActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  sent?: boolean;
};

export async function requestPasswordResetAction(
  _prev: ForgotPasswordActionState | null,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      message: "Please check the highlighted field.",
      fieldErrors,
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const origin = getAppOrigin();
  const redirectTo = `${origin}/auth/reset-password`;

  try {
    const admin = createServiceClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (!error && data?.properties?.hashed_token) {
      const resetUrl = `${origin}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery`;

      const sent = await sendPasswordResetEmail({
        to: email,
        resetUrl,
        siteUrl: origin,
      });

      if (!sent.ok) {
        console.error("[password-reset] Resend failed:", sent.error);
      }
    } else if (error) {
      console.error("[password-reset] generateLink:", error.message);
    }
  } catch (err) {
    console.error("[password-reset] unexpected error:", err);
  }

  return {
    ok: true,
    sent: true,
    message: authCopy.forgot.sent,
  };
}
