"use client";

import dynamic from "next/dynamic";
import { useActionState, useId, useRef, useState } from "react";
import {
  saveMemberWithdrawalSettings,
  updateMemberProfile,
  type MemberActionState,
} from "@/app/(member)/member/actions";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { experienceLevels, referralSources, withdrawCopy } from "@/content/site";
import type { MemberProfile } from "@/lib/supabase/auth";
import { WITHDRAWAL_PIN_LENGTH } from "@/lib/wallet/withdraw-shared";
import { cn } from "@/lib/utils";

const AvatarCropDialog = dynamic(
  () =>
    import("@/components/member/avatar-crop-dialog").then(
      (mod) => mod.AvatarCropDialog,
    ),
  { ssr: false },
);

const initialState: MemberActionState = {
  ok: false,
  message: "",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function MemberProfileForm({ profile }: { profile: MemberProfile }) {
  const [state, action, pending] = useActionState(
    updateMemberProfile,
    initialState,
  );
  const [withdrawState, withdrawAction, withdrawPending] = useActionState(
    saveMemberWithdrawalSettings,
    initialState,
  );
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [localError, setLocalError] = useState("");

  const previewUrl = removeAvatar
    ? null
    : (localPreview ?? profile.avatar_url);

  function revokeIfBlob(url: string | null) {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }

  function openPicker() {
    setLocalError("");
    fileInputRef.current?.click();
  }

  function onFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.has(file.type)) {
      setLocalError("Please choose a JPEG, PNG, or WebP photo.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    setCropOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function closeCrop() {
    setCropOpen(false);
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
    }
  }

  function onCropped(file: File, nextPreview: string) {
    revokeIfBlob(localPreview);
    setPendingFile(file);
    setRemoveAvatar(false);
    setLocalPreview(nextPreview);
    setLocalError("");
    closeCrop();
  }

  function onRemovePhoto() {
    revokeIfBlob(localPreview);
    setPendingFile(null);
    setLocalPreview(null);
    setRemoveAvatar(true);
    setLocalError("");
  }

  function submitProfile(formData: FormData) {
    formData.set("remove_avatar", removeAvatar ? "1" : "0");
    if (pendingFile) {
      formData.set("avatar", pendingFile);
    } else {
      formData.delete("avatar");
    }
    action(formData);
  }

  return (
    <>
      <form action={submitProfile} className="space-y-5">
        <div className="rounded-2xl border border-border/80 bg-white/70 p-4 sm:p-5">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-navy/45 uppercase">
            Profile photo
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div
              className={cn(
                "flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-navy/10 bg-navy text-2xl font-semibold text-cream shadow-[0_10px_24px_rgba(69,83,56,0.12)]",
              )}
              aria-hidden
            >
              {previewUrl ? (
                // Signed / blob preview URLs are ephemeral; avoid next/image cache.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                initials(profile.full_name || profile.email)
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm text-muted">
                Upload a clear face photo. We crop it square and optimize before
                saving.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={openPicker}>
                  {previewUrl ? "Change photo" : "Upload photo"}
                </Button>
                {previewUrl || profile.avatar_path ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onRemovePhoto}
                  >
                    Remove photo
                  </Button>
                ) : null}
              </div>
              {(localError || state.fieldErrors?.avatar) && (
                <p className="text-sm text-destructive" role="alert">
                  {localError || state.fieldErrors?.avatar}
                </p>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => onFileChange(e.target.files)}
          />
        </div>

        <Field
          label="Full name"
          htmlFor="full_name"
          error={state.fieldErrors?.full_name}
        >
          <Input
            id="full_name"
            name="full_name"
            defaultValue={profile.full_name}
            required
            aria-invalid={Boolean(state.fieldErrors?.full_name)}
          />
        </Field>

        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            value={profile.email}
            disabled
            readOnly
          />
          <p className="mt-1.5 text-xs text-muted">
            Email cannot be changed here. Message the team if you need an update.
          </p>
        </Field>

        <Field label="Mobile" htmlFor="mobile" error={state.fieldErrors?.mobile}>
          <Input
            id="mobile"
            name="mobile"
            defaultValue={profile.mobile ?? ""}
            placeholder="09xxxxxxxxx"
            aria-invalid={Boolean(state.fieldErrors?.mobile)}
          />
        </Field>

        <Field label="Occupation" htmlFor="occupation">
          <Input
            id="occupation"
            name="occupation"
            defaultValue={profile.occupation ?? ""}
            placeholder="Optional"
          />
        </Field>

        <Field label="Experience level" htmlFor="experience_level">
          <select
            id="experience_level"
            name="experience_level"
            defaultValue={profile.experience_level ?? ""}
            className="h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-ink"
          >
            <option value="">Select…</option>
            {experienceLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Messenger handle" htmlFor="messenger_handle">
          <Input
            id="messenger_handle"
            name="messenger_handle"
            defaultValue={profile.messenger_handle ?? ""}
            placeholder="Optional"
          />
        </Field>

        <Field label="How did you find us?" htmlFor="referral_source">
          <select
            id="referral_source"
            name="referral_source"
            defaultValue={profile.referral_source ?? ""}
            className="h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-ink"
          >
            <option value="">Select…</option>
            {referralSources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
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
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </form>

      <form
        action={withdrawAction}
        className="mt-8 space-y-5 border-t border-border pt-6"
      >
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">
            {withdrawCopy.profileSection}
          </h3>
          <p className="mt-1 text-sm text-muted">
            {withdrawCopy.profileSectionBody}
          </p>
        </div>

        <Field
          label={withdrawCopy.profileNumber}
          htmlFor="withdrawal_number"
          error={withdrawState.fieldErrors?.withdrawal_number}
        >
          <Input
            id="withdrawal_number"
            name="withdrawal_number"
            defaultValue={profile.withdrawal_number ?? ""}
            inputMode="numeric"
            autoComplete="off"
            placeholder="09xxxxxxxxx"
            aria-invalid={Boolean(withdrawState.fieldErrors?.withdrawal_number)}
          />
        </Field>

        {profile.has_withdrawal_pin ? (
          <p className="rounded-xl bg-teal-bright/20 px-3.5 py-2.5 text-sm text-navy">
            {withdrawCopy.profilePinSet}
          </p>
        ) : null}

        {profile.has_withdrawal_pin ? (
          <Field
            label={withdrawCopy.profilePinCurrent}
            htmlFor="current_pin"
            error={withdrawState.fieldErrors?.current_pin}
          >
            <Input
              id="current_pin"
              name="current_pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={WITHDRAWAL_PIN_LENGTH}
              aria-invalid={Boolean(withdrawState.fieldErrors?.current_pin)}
            />
          </Field>
        ) : null}

        <Field
          label={withdrawCopy.profilePin}
          htmlFor="pin"
          error={withdrawState.fieldErrors?.pin}
          hint={withdrawCopy.profilePinHint}
        >
          <Input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={WITHDRAWAL_PIN_LENGTH}
            aria-invalid={Boolean(withdrawState.fieldErrors?.pin)}
          />
        </Field>

        <Field
          label={withdrawCopy.profilePinConfirm}
          htmlFor="confirm_pin"
          error={withdrawState.fieldErrors?.confirm_pin}
        >
          <Input
            id="confirm_pin"
            name="confirm_pin"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={WITHDRAWAL_PIN_LENGTH}
            aria-invalid={Boolean(withdrawState.fieldErrors?.confirm_pin)}
          />
        </Field>

        {withdrawState.message ? (
          <p
            className={
              withdrawState.ok
                ? "rounded-xl bg-teal-bright/20 px-3.5 py-2.5 text-sm text-navy"
                : "rounded-xl bg-sand px-3.5 py-2.5 text-sm text-destructive"
            }
            role="status"
          >
            {withdrawState.message}
          </p>
        ) : null}

        <Button type="submit" variant="accent" disabled={withdrawPending}>
          {withdrawPending ? withdrawCopy.profileSaving : withdrawCopy.profileSave}
        </Button>
      </form>

      <AvatarCropDialog
        open={cropOpen}
        imageSrc={cropSrc}
        onCancel={closeCrop}
        onCropped={onCropped}
      />
    </>
  );
}
