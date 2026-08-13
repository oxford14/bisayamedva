import type { Metadata } from "next";
import { AuthShell } from "@/components/forms/auth-shell";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your Bisaya MedVA password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
