# Landing page overrides

**Pattern:** Gallery / editorial split hero + sectioned marketing (UI/UX Pro Max)
**Rejected from generator:** Claymorphism, Comic Neue, indigo/orange (conflicts with PRD)

## Layout
- Sections are full-width.
- Inner content uses `max-w-[1440px]` with adaptive gutters (`px-5 / sm:px-8 / lg:px-12 / xl:px-16`).
- Long-form copy still caps around `max-w-2xl` for readability.
- Weekend and final CTA may still use strong visual planes; hero is a white gallery canvas (not full-bleed dark photo).

## Hero
White split gallery layout:
- Left: eyebrow, serif headline, support, primary + outlined secondary CTA.
- Center/right: studio portrait framed with sage geometric SVG accents (circle, arc, dot, dot grid).
- Far-right rail: next weekend session from `site.nextSession`.
- No price ticker in the first viewport (price lives in Pricing).
- Photo asset: `/images/hero/studio-portrait.webp` (source: `public/hero image.jpg`).

## Header
Light sticky bar, uppercase tracked nav links with sage underline on hover, solid Register CTA. Menu items unchanged.

## Motion
- Copy / portrait / session rail: staggered fade-up via `motion` on load.
- Geometry objects: CSS loops (`animate-float-slow`, `animate-float-slower`, `animate-spin-slower`, `animate-pulse-soft`).
- Disable under `prefers-reduced-motion`. Do not hide SEO content at opacity 0 permanently.

## Anti-patterns
No glassmorphism, no clay toy UI, no purple gradients, no fake testimonials.
