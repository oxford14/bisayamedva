import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

export type RegistrationIntentPayload = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  occupation?: string;
  experienceLevel?: string;
  messengerName?: string;
  referralSource?: string;
  promoCode?: string;
  refCode?: string;
};

function loadKey(): Buffer {
  const raw = process.env.REGISTRATION_INTENT_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("Missing REGISTRATION_INTENT_ENCRYPTION_KEY.");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "REGISTRATION_INTENT_ENCRYPTION_KEY must be 32 bytes (base64-encoded).",
    );
  }
  return key;
}

export function encryptRegistrationPayload(payload: RegistrationIntentPayload): {
  ciphertext: string;
  iv: string;
} {
  const key = loadKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = JSON.stringify(payload);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([encrypted, tag]);
  return {
    ciphertext: combined.toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptRegistrationPayload(input: {
  ciphertext: string;
  iv: string;
}): RegistrationIntentPayload {
  const key = loadKey();
  const iv = Buffer.from(input.iv, "base64");
  const combined = Buffer.from(input.ciphertext, "base64");
  if (combined.length < 17) {
    throw new Error("Invalid registration intent ciphertext.");
  }
  const tag = combined.subarray(combined.length - 16);
  const encrypted = combined.subarray(0, combined.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
  return JSON.parse(plaintext) as RegistrationIntentPayload;
}

export function clearRegistrationPayloadFields() {
  return { payload_ciphertext: "", payload_iv: "" };
}
