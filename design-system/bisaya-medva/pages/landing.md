# Landing page overrides

**Pattern:** Hero-Centric + Editorial Grid / Magazine (UI/UX Pro Max)
**Rejected from generator:** Claymorphism, Comic Neue, indigo/orange (conflicts with PRD)

## Layout
- Sections are full-width.
- Inner content uses `max-w-[1440px]` with adaptive gutters (`px-5 / sm:px-8 / lg:px-12 / xl:px-16`).
- Long-form copy still caps around `max-w-2xl` for readability.
- Hero, who-for photos, weekend, and final CTA may bleed to the viewport edges.

## Hero
Full-bleed photography. Headline over the dark left side. One primary CTA. Sticky nav CTA.

## Motion
Standard stagger 300–450ms on cards. Disable under `prefers-reduced-motion`. Do not hide SEO content at opacity 0.

## Anti-patterns
No glassmorphism, no clay toy UI, no purple gradients, no fake testimonials.
