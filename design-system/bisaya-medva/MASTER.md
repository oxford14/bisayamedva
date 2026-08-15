# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/bisaya-medva/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

**Project:** Bisaya MedVA
**Updated:** 2026-08-15 — olive/sage brand palette
**Category:** Medical VA training / career education (not a clinic)
**Design Dials:** Variance 4/10 | Motion 3/10 | Density 3/10 (Spacious)

Brand colors are olive `#5B6D49` and sage `#A2AC82`. Tailwind token names remain `navy` / `teal` for class stability; values map to olive/sage.

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable / Tailwind |
|------|-----|-------------------------|
| Olive / Primary | `#5B6D49` | `--navy`, `--teal`, `--ring` |
| Olive Deep | `#455338` | `--navy-deep` |
| On Primary | `#F5F6F0` | cream on olive |
| Sage Bright | `#A2AC82` | `--teal-bright` |
| Cream / Background | `#F5F6F0` | `--cream` |
| Foreground / Ink | `#2F3826` | `--ink` |
| Card | `#FFFFFF` | `--card` |
| Sand | `#E4E7D8` | `--sand` |
| Muted | `#66705A` | `--muted` |
| Border | `#D5DAC8` | `--border` |
| Destructive | `#B42318` | `--destructive` |

Contrast targets: olive `#5B6D49` on cream, and white on olive CTAs (4.5:1).

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
- Shadows: soft olive-tinted (`rgba(91,109,73,0.08)`), never neon glow

---

## Component Specs

- **Primary button:** olive fill, cream text, 12px 22px, radius 10px, min height 44px, `cursor-pointer`
- **Accent button:** olive fill, white text (hero CTA); hover olive-deep
- **Secondary:** transparent, olive text, 1px sand/olive border
- **Cards:** white on cream, 1px sand border, no glassmorphism
- **Inputs:** 16px text, visible labels, focus ring olive 3px

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
