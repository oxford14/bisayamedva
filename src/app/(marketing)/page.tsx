import { Curriculum } from "@/components/marketing/curriculum";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { NotIncluded } from "@/components/marketing/not-included";
import { Pricing } from "@/components/marketing/pricing";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { WeekendTraining } from "@/components/marketing/weekend-training";
import { WhoFor } from "@/components/marketing/who-for";
import { WhyBilling } from "@/components/marketing/why-billing";
import { WhyBisaya } from "@/components/marketing/why-bisaya";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <WhyBilling />
      <Curriculum />
      <NotIncluded />
      <WhoFor />
      <HowItWorks />
      <WeekendTraining />
      <Pricing />
      <WhyBisaya />
      <Faq />
      <FinalCta />
    </>
  );
}
