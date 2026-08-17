export const REGISTER_DRAFT_KEY = "bisayamedva.register.draft.v1";

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
  sessionId: string;
};

export function saveRegisterDraft(draft: RegisterDraft) {
  sessionStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(draft));
}

export function readRegisterDraft(): RegisterDraft | null {
  try {
    const raw = sessionStorage.getItem(REGISTER_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegisterDraft;
    if (!parsed?.email || !parsed?.password || !parsed?.sessionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearRegisterDraft() {
  sessionStorage.removeItem(REGISTER_DRAFT_KEY);
}
