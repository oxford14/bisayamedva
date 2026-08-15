import { site } from "@/content/site";

/** Absolute origin for payment links (env first, then site.url). */
export function getAppOrigin() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    site.url.replace(/\/$/, "")
  );
}

export function getPaymentPayUrl(paymentId: string, origin = getAppOrigin()) {
  return `${origin.replace(/\/$/, "")}/pay/${paymentId}`;
}
