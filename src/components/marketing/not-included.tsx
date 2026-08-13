import { Container, displayTitle, sectionPad } from "@/components/marketing/container";
import { notIncluded } from "@/content/site";

export function NotIncluded() {
  return (
    <section className={`relative bg-navy text-cream ${sectionPad}`}>
      <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-50" />
      <Container className="relative">
        <p className="text-xs font-semibold tracking-[0.2em] text-teal-bright uppercase">
          {notIncluded.eyebrow}
        </p>
        <h2 className={`mt-4 ${displayTitle}`}>{notIncluded.title}</h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-cream/75">
          {notIncluded.body}
        </p>
        <ul className="mt-10 flex flex-wrap gap-3">
          {notIncluded.topics.map((topic) => (
            <li
              key={topic}
              className="rounded-full border border-white/15 bg-white/6 px-5 py-2.5 text-sm"
            >
              {topic}
              <span className="ml-2 text-cream/50">Coming Soon</span>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-cream/55">{notIncluded.note}</p>
      </Container>
    </section>
  );
}
