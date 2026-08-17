import type { Metadata } from "next";
import { DeepDiveCheckoutPanel } from "@/components/member/deep-dive-checkout-panel";
import { MemberPageHeader } from "@/components/member/ui";
import { deepDiveBundle } from "@/content/courses";

export const metadata: Metadata = {
  title: "Pay Deep Dive",
  description: `PayMongo QR Ph checkout for ${deepDiveBundle.title}.`,
};

export default function DeepDiveCheckoutPage() {
  return (
    <div>
      <MemberPageHeader
        title="Deep Dive payment"
        description="Scan the live PayMongo QR Ph — same in-app payment style as registration."
      />
      <DeepDiveCheckoutPanel />
    </div>
  );
}
