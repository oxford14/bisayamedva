import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Container, displayTitle, sectionPad } from "@/components/marketing/container";
import { faqs } from "@/content/site";

export function Faq() {
  return (
    <section id="faq" className={`scroll-mt-24 bg-white ${sectionPad}`}>
      <Container className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
            FAQ
          </p>
          <h2 className={`mt-4 text-navy ${displayTitle}`}>
            Klaro nga answers before you register.
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </section>
  );
}
