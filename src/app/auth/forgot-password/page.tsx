import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/forms/auth-shell";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your Bisaya MedVA password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
