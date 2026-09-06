import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { WITHDRAWAL_PIN_LENGTH } from "@/lib/wallet/withdraw-shared";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export function isValidWithdrawalPin(pin: string) {
  return new RegExp(`^\\d{${WITHDRAWAL_PIN_LENGTH}}$`).test(pin);
}

export async function hashWithdrawalPin(pin: string) {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(pin, salt, KEY_LENGTH)) as Buffer;
  return `${salt.toString("base64")}:${derived.toString("base64")}`;
}

export async function verifyWithdrawalPin(pin: string, stored: string) {
  const [saltB64, hashB64] = stored.split(":");
  if (!saltB64 || !hashB64) return false;

  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  if (expected.length === 0) return false;

  const derived = (await scryptAsync(pin, salt, KEY_LENGTH)) as Buffer;
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
