"use client";

import { useActionState } from "react";
import {
  updateMemberPassword,
  type MemberActionState,
} from "@/app/(member)/member/actions";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: MemberActionState = {
  ok: false,
  message: "",
};

export function MemberPasswordForm() {
  const [state, action, pending] = useActionState(
    updateMemberPassword,
    initialState,
  );

  return (
    <form
      key={state.ok ? state.message : "password-form"}
      action={action}
      className="space-y-5"
    >
      <Field
        label="Current password"
        htmlFor="current_password"
        error={state.fieldErrors?.currentPassword}
      >
        <Input
          id="current_password"
          name="current_password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.currentPassword)}
        />
      </Field>

      <Field
        label="New password"
        htmlFor="new_password"
        error={state.fieldErrors?.newPassword}
        hint="At least 8 characters."
      >
        <Input
          id="new_password"
          name="new_password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.newPassword)}
        />
      </Field>

      <Field
        label="Confirm new password"
        htmlFor="confirm_password"
        error={state.fieldErrors?.confirmPassword}
      >
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
        />
      </Field>

      {state.message ? (
        <p
          className={
            state.ok
              ? "rounded-xl bg-teal-bright/20 px-3.5 py-2.5 text-sm text-navy"
              : "rounded-xl bg-sand px-3.5 py-2.5 text-sm text-destructive"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
