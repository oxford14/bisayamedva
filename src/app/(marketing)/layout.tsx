import { MobileCta } from "@/components/marketing/mobile-cta";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { getCurrentProfile } from "@/lib/supabase/auth";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader profile={profile} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <SiteFooter />
      <MobileCta />
    </div>
  );
}
