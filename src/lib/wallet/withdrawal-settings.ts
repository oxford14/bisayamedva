import { createServiceClient } from "@/lib/supabase/admin";
import { withdrawCopy } from "@/content/site";
import {
  hashWithdrawalPin,
  isValidWithdrawalPin,
  verifyWithdrawalPin,
} from "@/lib/wallet/withdrawal-pin";

type SettingsResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function saveWithdrawalSettings(input: {
  studentId: string;
  withdrawalNumber: string;
  pin: string;
  confirmPin: string;
  currentPin: string;
}): Promise<SettingsResult> {
  const number = input.withdrawalNumber.replace(/\s+/g, "").trim();
  const pin = input.pin.trim();
  const confirmPin = input.confirmPin.trim();
  const currentPin = input.currentPin.trim();

  if (number && number.length < 6) {
    return {
      ok: false,
      error: "Please enter a valid withdrawal number.",
      fieldErrors: { withdrawal_number: "Please enter a valid account number or mobile." },
    };
  }

  const admin = createServiceClient();
  const { data: row, error: loadError } = await admin
    .from("profiles")
    .select("withdrawal_pin_hash")
    .eq("id", input.studentId)
    .maybeSingle();

  if (loadError || !row) {
    return { ok: false, error: "Could not load your withdrawal settings." };
  }

  const existingHash = (row.withdrawal_pin_hash as string | null) ?? null;
  const changingPin = Boolean(pin || confirmPin || currentPin);

  if (!changingPin && !existingHash && !number) {
    return { ok: false, error: "Enter a withdrawal number or set a 6-digit PIN." };
  }

  const patch: {
    withdrawal_number: string | null;
    withdrawal_pin_hash?: string;
    withdrawal_pin_set_at?: string;
  } = {
    withdrawal_number: number || null,
  };

  if (changingPin) {
    if (existingHash) {
      if (!isValidWithdrawalPin(currentPin)) {
        return {
          ok: false,
          error: withdrawCopy.pinInvalid,
          fieldErrors: { current_pin: withdrawCopy.pinInvalid },
        };
      }
      const matches = await verifyWithdrawalPin(currentPin, existingHash);
      if (!matches) {
        return {
          ok: false,
          error: withdrawCopy.pinWrong,
          fieldErrors: { current_pin: withdrawCopy.pinWrong },
        };
      }
    }

    if (!isValidWithdrawalPin(pin)) {
      return {
        ok: false,
        error: withdrawCopy.pinInvalid,
        fieldErrors: { pin: withdrawCopy.pinInvalid },
      };
    }
    if (pin !== confirmPin) {
      return {
        ok: false,
        error: withdrawCopy.pinMismatch,
        fieldErrors: { confirm_pin: withdrawCopy.pinMismatch },
      };
    }

    patch.withdrawal_pin_hash = await hashWithdrawalPin(pin);
    patch.withdrawal_pin_set_at = new Date().toISOString();
  }

  const { error } = await admin.from("profiles").update(patch).eq("id", input.studentId);
  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function verifyStudentWithdrawalPin(
  studentId: string,
  pin: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isValidWithdrawalPin(pin)) {
    return { ok: false, error: withdrawCopy.pinInvalid };
  }

  const admin = createServiceClient();
  const { data, error } = await admin
    .from("profiles")
    .select("withdrawal_pin_hash")
    .eq("id", studentId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  const stored = (data?.withdrawal_pin_hash as string | null) ?? null;
  if (!stored) {
    return { ok: false, error: withdrawCopy.pinRequired };
  }

  const matches = await verifyWithdrawalPin(pin, stored);
  if (!matches) {
    return { ok: false, error: withdrawCopy.pinWrong };
  }

  return { ok: true };
}
