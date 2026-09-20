export const PORTFOLIO_RESERVED_SLUGS = new Set([
  "admin",
  "member",
  "auth",
  "register",
  "verify",
  "portfolio",
  "preview",
  "api",
  "pay",
  "www",
  "app",
  "static",
  "images",
  "practice",
]);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyDisplayName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 48);
}

export function normalizePortfolioSlug(input: string): string {
  return slugifyDisplayName(input);
}

export function validatePortfolioSlug(slug: string): string | null {
  const normalized = normalizePortfolioSlug(slug);
  if (normalized.length < 3) {
    return "URL slug needs at least 3 characters (letters or numbers).";
  }
  if (normalized.length > 48) {
    return "URL slug is too long (max 48 characters).";
  }
  if (!SLUG_PATTERN.test(normalized)) {
    return "Use lowercase letters, numbers, and hyphens only.";
  }
  if (PORTFOLIO_RESERVED_SLUGS.has(normalized)) {
    return "That URL slug is reserved. Pick another one.";
  }
  return null;
}

export function suggestSlugFromName(fullName: string): string {
  const base = slugifyDisplayName(fullName);
  if (base.length >= 3 && !PORTFOLIO_RESERVED_SLUGS.has(base)) {
    return base;
  }
  const fallback = base ? `${base}-va` : "my-portfolio";
  return fallback.slice(0, 48);
}
