"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resetPasswordSchema } from "@/lib/validations/auth";

export type ResetPasswordActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function updatePasswordAfterRecoveryAction(
  _prev: ResetPasswordActionState | null,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/forgot-password");
  }

  const parsed = resetPasswordSchema.safeParse({
    newPassword: String(formData.get("new_password") ?? ""),
    confirmPassword: String(formData.get("confirm_password") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key =
        issue.path[0] === "newPassword"
          ? "newPassword"
          : issue.path[0] === "confirmPassword"
            ? "confirmPassword"
            : String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) {
    return {
      ok: false,
      message: error.message || "Could not update your password. Try again.",
    };
  }

  await supabase.auth.signOut({ scope: "local" });
  redirect("/auth/login?reset=success");
}
