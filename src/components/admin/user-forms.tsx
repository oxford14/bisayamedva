"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createAdminUser,
  deleteAdminUser,
  updateAdminUser,
  updateUserRole,
} from "@/app/(admin)/admin/actions";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { experienceLevels } from "@/content/site";

export function CreateUserForm({
  canCreateSuperAdmin,
}: {
  canCreateSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button type="button" variant="accent" onClick={() => setOpen(true)}>
        Add user
      </Button>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">Create user</h2>
          <p className="mt-1 text-sm text-muted">
            Creates a login account and profile. Default role is Student.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>

      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          setError("");
          startTransition(async () => {
            const result = await createAdminUser(formData);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setOpen(false);
            router.push(`/admin/users?view=${result.userId}`);
            router.refresh();
          });
        }}
      >
        <Field label="Full name" htmlFor="full_name">
          <Input id="full_name" name="full_name" required />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" required />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" name="password" type="password" minLength={8} required />
        </Field>
        <Field label="Mobile" htmlFor="mobile">
          <Input id="mobile" name="mobile" />
        </Field>
        <Field label="Occupation" htmlFor="occupation">
          <Input id="occupation" name="occupation" />
        </Field>
        <Field label="Experience" htmlFor="experience_level">
          <select
            id="experience_level"
            name="experience_level"
            className="flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5"
            defaultValue=""
          >
            <option value="">—</option>
            {experienceLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Role" htmlFor="role">
          <select
            id="role"
            name="role"
            className="flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5"
            defaultValue="STUDENT"
          >
            <option value="STUDENT">STUDENT</option>
            <option value="ADMIN">ADMIN</option>
            {canCreateSuperAdmin ? (
              <option value="SUPER_ADMIN">SUPER ADMIN</option>
            ) : null}
          </select>
        </Field>

        {error ? (
          <p className="sm:col-span-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="sm:col-span-2">
          <Button type="submit" variant="accent" disabled={pending}>
            {pending ? "Creating…" : "Create user"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function EditUserForm({
  user,
}: {
  user: {
    id: string;
    full_name: string;
    email: string;
    mobile: string | null;
    occupation: string | null;
    experience_level: string | null;
    messenger_handle: string | null;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="rounded-2xl border border-border bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setError("");
        setSuccess("");
        startTransition(async () => {
          const result = await updateAdminUser(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setSuccess("Saved. Updated na ang user profile.");
          router.refresh();
        });
      }}
    >
      <h2 className="font-semibold text-ink">Edit profile</h2>
      <p className="mt-1 text-sm text-muted">
        Update account details. Leave password blank to keep the current one.
      </p>

      <input type="hidden" name="user_id" value={user.id} />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Full name" htmlFor="edit_full_name">
          <Input
            id="edit_full_name"
            name="full_name"
            required
            defaultValue={user.full_name}
          />
        </Field>
        <Field label="Email" htmlFor="edit_email">
          <Input
            id="edit_email"
            name="email"
            type="email"
            required
            defaultValue={user.email}
          />
        </Field>
        <Field label="Mobile" htmlFor="edit_mobile">
          <Input
            id="edit_mobile"
            name="mobile"
            defaultValue={user.mobile ?? ""}
          />
        </Field>
        <Field label="Occupation" htmlFor="edit_occupation">
          <Input
            id="edit_occupation"
            name="occupation"
            defaultValue={user.occupation ?? ""}
          />
        </Field>
        <Field label="Experience" htmlFor="edit_experience_level">
          <select
            id="edit_experience_level"
            name="experience_level"
            className="flex h-12 w-full rounded-[10px] border border-border bg-white px-3.5"
            defaultValue={user.experience_level ?? ""}
          >
            <option value="">—</option>
            {experienceLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Messenger" htmlFor="edit_messenger_handle">
          <Input
            id="edit_messenger_handle"
            name="messenger_handle"
            defaultValue={user.messenger_handle ?? ""}
          />
        </Field>
        <Field
          label="New password"
          htmlFor="edit_password"
          hint="Optional. Min 8 characters."
        >
          <Input
            id="edit_password"
            name="password"
            type="password"
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-3 text-sm text-navy" role="status">
          {success}
        </p>
      ) : null}

      <Button type="submit" variant="accent" className="mt-4" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

export function UserRoleActions({
  userId,
  role,
  isSelf,
  isSuperAdmin,
}: {
  userId: string;
  role: string;
  isSelf: boolean;
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-white p-5">
      <div>
        <h2 className="font-semibold text-ink">Role & access</h2>
        <p className="mt-1 text-sm text-muted">
          {isSuperAdmin
            ? "Choose Student, Admin, or Super Admin for this account."
            : "Choose Student or Admin for this account."}
        </p>
      </div>

      {role === "SUPER_ADMIN" && !isSuperAdmin ? (
        <p className="text-sm text-muted">
          Only a Super Admin can change this role.
        </p>
      ) : (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            setError("");
            setSuccess("");
            startTransition(async () => {
              try {
                const result = await updateUserRole(formData);
                if (!result?.ok) {
                  setError(result?.error ?? "Could not update role.");
                  return;
                }
                setSuccess("Role updated.");
                router.refresh();
              } catch {
                setError("Could not update role. Try again.");
              }
            });
          }}
        >
        <input type="hidden" name="user_id" value={userId} />
        <div>
          <label
            htmlFor="role_select"
            className="mb-1.5 block text-xs font-semibold tracking-wide text-muted uppercase"
          >
            Set role
          </label>
          <select
            id="role_select"
            name="role"
            defaultValue={role}
            className="h-10 rounded-[10px] border border-border bg-white px-2 text-sm"
          >
            <option value="STUDENT">STUDENT</option>
            <option value="ADMIN">ADMIN</option>
            {isSuperAdmin ? (
              <option value="SUPER_ADMIN">SUPER ADMIN</option>
            ) : null}
          </select>
        </div>
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? "Saving…" : "Update role"}
        </Button>
      </form>
      )}

      {!isSelf ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const confirmed = window.confirm(
              "Delete this user permanently? This cannot be undone.",
            );
            if (!confirmed) return;
            const formData = new FormData(e.currentTarget);
            setError("");
            setSuccess("");
            startTransition(async () => {
              try {
                const result = await deleteAdminUser(formData);
                if (!result?.ok) {
                  setError(result?.error ?? "Could not delete user.");
                  return;
                }
                router.push("/admin/users");
                router.refresh();
              } catch {
                setError("Could not delete user. Try again.");
              }
            });
          }}
        >
          <input type="hidden" name="user_id" value={userId} />
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Deleting…" : "Delete user"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted">You cannot delete your own account here.</p>
      )}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-navy" role="status">
          {success}
        </p>
      ) : null}
    </div>
  );
}
