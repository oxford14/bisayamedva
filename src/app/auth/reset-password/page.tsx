import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/forms/auth-shell";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Set new password",
  description: "Choose a new password for your Bisaya MedVA account.",
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/forgot-password");
  }

  return (
    <AuthShell>
      <ResetPasswordForm />
    </AuthShell>
  );
}
