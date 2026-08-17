import type { Metadata } from "next";
import { AuthShell } from "@/components/forms/auth-shell";
import { CheckoutPaymentPanel } from "@/components/forms/checkout-payment-panel";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Checkout",
  description: `PayMongo QR Ph checkout for ${site.featuredCourse.name}.`,
};

export default function CheckoutPage() {
  return (
    <AuthShell>
      <CheckoutPaymentPanel />
    </AuthShell>
  );
}
