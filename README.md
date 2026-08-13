# Bisaya MedVA

Medical Virtual Assistant training and career development. First public slice: landing page + registration/login shells for **Medical Billing Training**.

- Domain: [bisayamedva.com](https://bisayamedva.com)
- Public copy: **Bisaya-English only** (no Tagalog/Taglish)
- Stack: Next.js App Router, TypeScript, Tailwind CSS, shadcn-style primitives

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What this slice includes

- Photography-led landing page focused on Medical Billing
- Login, forgot password, multi-step register, PayMongo checkout placeholder
- Design tokens in `src/app/globals.css`
- Copy, price, and weekend session in `src/content/site.ts`
- UI/UX Pro Max design system in `design-system/bisaya-medva/` (PRD navy/teal overrides)

## Not in this slice

PayMongo charges, Supabase auth, student/admin dashboards, Resend, LMS.
