export const REGISTER_DRAFT_KEY = "bisayamedva.register.draft.v1";
export const REGISTER_CHECKOUT_KEY = "bisayamedva.register.checkout.v1";

export type RegisterCheckoutSession = {
  paymentId: string;
  pollSecret: string;
};

export type RegisterDraft = {
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

export function saveRegisterDraft(draft: RegisterDraft) {
  sessionStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(draft));
}

export function readRegisterDraft(): RegisterDraft | null {
  try {
    const raw = sessionStorage.getItem(REGISTER_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegisterDraft;
    if (!parsed?.email || !parsed?.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearRegisterDraft() {
  sessionStorage.removeItem(REGISTER_DRAFT_KEY);
  sessionStorage.removeItem(REGISTER_CHECKOUT_KEY);
}

export function saveRegisterCheckoutSession(session: RegisterCheckoutSession) {
  sessionStorage.setItem(REGISTER_CHECKOUT_KEY, JSON.stringify(session));
}

export function readRegisterCheckoutSession(): RegisterCheckoutSession | null {
  try {
    const raw = sessionStorage.getItem(REGISTER_CHECKOUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegisterCheckoutSession;
    if (!parsed?.paymentId || !parsed?.pollSecret) return null;
    return parsed;
  } catch {
    return null;
  }
}
