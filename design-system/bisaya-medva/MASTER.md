# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/bisaya-medva/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

**Project:** Bisaya MedVA
**Generated:** 2026-08-14 (UI/UX Pro Max) then **overridden by PRD tokens**
**Category:** Medical VA training / career education (not a clinic)
**Design Dials:** Variance 4/10 | Motion 3/10 | Density 3/10 (Spacious)

Pro Max suggested cyan neumorphism + Figtree. **Do not use that.** The PRD requires deep navy, medical teal, warm neutrals, photography-led career education, and no hospital/glass/AI-gradient look.

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Navy / Primary | `#0B1F3A` | `--color-primary` |
| On Primary | `#F7F5F2` | `--color-on-primary` |
| Teal / Accent | `#0C7A70` | `--color-accent` |
| On Accent | `#FFFFFF` | `--color-on-accent` |
| Teal Bright | `#14A896` | `--color-teal-bright` |
| Background | `#F7F5F2` | `--color-background` |
| Foreground | `#1A2332` | `--color-foreground` |
| Card | `#FFFFFF` | `--color-card` |
| Sand | `#E8E2D9` | `--color-sand` |
| Muted | `#5C6570` | `--color-muted-foreground` |
| Border | `#D9D2C8` | `--color-border` |
| Destructive | `#B42318` | `--color-destructive` |
| Ring | `#0C7A70` | `--color-ring` |

Contrast: navy `#0B1F3A` on cream, and white on `#0C7A70`, both meet 4.5:1.

### Typography

- **Heading:** Fraunces (editorial, human, not hospital)
- **Body / UI:** Plus Jakarta Sans
- **Base:** 16px, line-height 1.55
- **Mood:** career, local, premium, calm

### Spacing

| Token | Value |
|-------|-------|
| `--space-xs` | `4px` |
| `--space-sm` | `8px` |
| `--space-md` | `24px` |
| `--space-lg` | `32px` |
| `--space-xl` | `48px` |
| `--space-2xl` | `64px` |
| `--space-3xl` | `96px` |

### Radius & Shadow

- Radius: 10px controls, 16px cards, 24px feature panels
- Shadows: soft navy-tinted (`rgba(11,31,58,0.08)`), never neon glow

---

## Component Specs

- **Primary button:** navy fill, cream text, 12px 22px, radius 10px, min height 44px, `cursor-pointer`
- **Accent button:** teal fill, white text (hero CTA)
- **Secondary:** transparent, navy text, 1px sand/navy border
- **Cards:** white on cream, 1px sand border, no glassmorphism
- **Inputs:** 16px text, visible labels, focus ring teal 3px

---

## Style Guidelines

**Style:** Photography-led editorial + clean healthcare-education (not neumorphism)

**Pattern:** Hero-Centric + Conversion-Optimized + Trust strip (no fake testimonials)

**Motion:** 200–400ms fade/translateY 8–12px. Honor `prefers-reduced-motion`. Never hide SEO content at opacity 0 without a no-JS fallback.

---

## Anti-Patterns

- AI purple/pink gradients, glassmorphism, floating blobs, neon
- Hospital stock (scrubs, stethoscopes, clinic corridors)
- Emoji as icons
- Tagalog / Taglish
- Fake testimonials or company logos
- Hard-coded prices or schedules in components
- Rainbow / meteor / sparkle marketing effects

---

## Pre-Delivery Checklist

- [ ] Lucide icons only
- [ ] `cursor-pointer` on clickable elements
- [ ] Contrast 4.5:1
- [ ] Visible focus rings
- [ ] `prefers-reduced-motion`
- [ ] 375 / 768 / 1024 / 1440
- [ ] Bisaya-English copy audit
