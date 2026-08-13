import type { Metadata } from "next";
import { AuthShell } from "@/components/forms/auth-shell";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your Bisaya MedVA student account.",
};

export default function LoginPage() {
  return (
    <AuthShell image="hero">
      <LoginForm />
    </AuthShell>
  );
}
