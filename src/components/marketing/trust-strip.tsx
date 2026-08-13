import { CalendarDays, Globe, Languages, Wallet } from "lucide-react";
import { Container } from "@/components/marketing/container";
import { site, trustItems } from "@/content/site";
import { formatPeso } from "@/lib/utils";

const icons = [CalendarDays, Globe, Languages, Wallet];

export function TrustStrip() {
  return (
    <section className="w-full border-b border-navy/8 bg-white">
      <Container className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10 lg:py-12">
        {trustItems.map((item, i) => {
          const Icon = icons[i];
          const title =
            item.title === "One-time fee"
              ? `${formatPeso(site.featuredCourse.price)} one-time`
              : item.title;
          return (
            <div key={item.title} className="flex gap-3">
              <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-sand text-teal">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold text-navy">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </div>
            </div>
          );
        })}
      </Container>
    </section>
  );
}
