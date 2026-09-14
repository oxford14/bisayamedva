/** Only this account may credit member wallets from admin. */
export const WALLET_CREDIT_ADMIN_EMAIL = "oxfordgalawan@gmail.com";

export function canCreditMemberWallets(profile: { email: string }) {
  return (
    profile.email.trim().toLowerCase() ===
    WALLET_CREDIT_ADMIN_EMAIL.toLowerCase()
  );
}
