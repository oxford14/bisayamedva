import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/forms/auth-shell";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your Bisaya MedVA student account.",
};

export default function LoginPage() {
  return (
    <AuthShell image="hero">
      <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
