import {
  BookOpen,
  ClipboardList,
  Code2,
  FileText,
  Layers,
  Workflow,
} from "lucide-react";
import { Container, displayTitle, sectionPad } from "@/components/marketing/container";
import { curriculum } from "@/content/site";

const icons = [BookOpen, Workflow, ClipboardList, FileText, Layers, Code2];

export function Curriculum() {
  return (
    <section id="what-youll-learn" className={`scroll-mt-24 bg-white ${sectionPad}`}>
      <Container>
        <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
          {curriculum.eyebrow}
        </p>
        <h2 className={`mt-4 max-w-3xl text-navy ${displayTitle}`}>
          {curriculum.title}
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          {curriculum.intro}
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {curriculum.items.map((item, i) => {
            const Icon = icons[i];
            const featured = i === 0;
            return (
              <article
                key={item.title}
                className={
                  featured
                    ? "rounded-[24px] border border-navy/10 bg-navy p-8 text-cream sm:col-span-2 lg:col-span-2"
                    : "rounded-[24px] border border-border bg-cream/70 p-7 transition-shadow duration-200 hover:shadow-[0_16px_40px_rgba(91,109,73,0.07)]"
                }
              >
                <span
                  className={
                    featured
                      ? "flex size-11 items-center justify-center rounded-[12px] bg-teal text-white"
                      : "flex size-11 items-center justify-center rounded-[12px] bg-navy text-cream"
                  }
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3
                  className={
                    featured
                      ? "mt-5 font-display text-2xl font-semibold"
                      : "mt-5 font-semibold text-navy"
                  }
                >
                  {item.title}
                </h3>
                <p
                  className={
                    featured
                      ? "mt-3 max-w-lg text-cream/75 leading-relaxed"
                      : "mt-2 text-sm leading-relaxed text-muted"
                  }
                >
                  {item.body}
                </p>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
