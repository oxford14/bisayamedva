"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis } from "lucide-react";
import { useEffect, useState } from "react";
import { memberNav, type MemberNavItem } from "@/components/member/nav-config";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";
import type { MemberProfile } from "@/lib/supabase/auth";

function firstName(name: string) {
  return name.split(/\s+/).filter(Boolean)[0] ?? "Student";
}

export function MemberShell({
  profile,
  children,
}: {
  profile: MemberProfile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreOpenedAt, setMoreOpenedAt] = useState(pathname);

  const primaryMobile = memberNav.filter((item) => item.mobilePrimary);
  const moreMobile = memberNav.filter((item) => !item.mobilePrimary);
  const moreSheetOpen = moreOpen && moreOpenedAt === pathname;

  useEffect(() => {
    if (!moreSheetOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreSheetOpen]);

  function isActive(item: MemberNavItem) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  const moreActive = moreMobile.some((item) => isActive(item));

  function openMore() {
    setMoreOpenedAt(pathname);
    setMoreOpen(true);
  }
  return (
    <div className="min-h-dvh bg-cream text-ink">
      <div className="flex min-h-dvh w-full">
        <aside className="sticky top-0 z-30 hidden h-dvh w-[17.5rem] shrink-0 flex-col border-r border-border/80 bg-[linear-gradient(180deg,#fbfcf7_0%,#f3f5eb_48%,#eef1e4_100%)] lg:flex">
          <div className="relative overflow-hidden border-b border-border/70 px-5 pt-5 pb-4">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-10 -right-8 size-36 rounded-full bg-[radial-gradient(circle,rgba(91,109,73,0.14),transparent_70%)]"
            />
            <Link
              href="/member"
              className="relative inline-flex items-center gap-3"
              aria-label="Member home"
            >
              <span className="relative flex size-11 items-center justify-center overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-[0_8px_20px_rgba(69,83,56,0.08)]">
                <Image
                  src="/images/brand/logo-mark.png"
                  alt=""
                  width={64}
                  height={64}
                  className="size-8 object-contain"
                  priority
                />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[1.15rem] leading-tight font-semibold tracking-tight text-ink">
                  Bisaya MedVA
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.16em] text-navy/55 uppercase">
                  My training
                </span>
              </span>
            </Link>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-5" aria-label="Member">
            {memberNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl px-2.5 py-2.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-200",
                    active
                      ? "bg-navy text-cream shadow-[0_10px_24px_rgba(69,83,56,0.18)]"
                      : "text-navy/70 hover:bg-white/80 hover:text-navy hover:shadow-[0_6px_16px_rgba(69,83,56,0.06)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl transition-colors",
                      active
                        ? "bg-white/15 text-cream"
                        : "bg-white text-navy/65 group-hover:text-navy",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {active ? (
                    <span
                      className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-teal-bright"
                      aria-hidden
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/80 bg-cream/90 px-4 backdrop-blur-md lg:px-8">
            <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
              <span className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-navy/10 bg-navy text-[11px] font-semibold text-cream">
                {profile.avatar_url ? (
                  // Signed URLs rotate; skip next/image caching.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  (profile.full_name || "S")
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join("") || "S"
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-semibold text-ink">
                  Hi, {firstName(profile.full_name)}
                </p>
                <p className="truncate text-[10px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
                  My training
                </p>
              </div>
            </div>
            <div className="ml-auto">
              <UserMenu profile={profile} />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
            {children}
          </main>
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-cream/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Member mobile navigation"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 gap-0.5 px-1.5 pt-1.5 pb-1">
          {primaryMobile.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-semibold tracking-wide transition-colors",
                    active
                      ? "bg-navy text-cream"
                      : "text-navy/60 hover:bg-sand hover:text-navy",
                  )}
                >
                  <Icon className="size-[1.15rem]" aria-hidden />
                  <span className="max-w-full truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={openMore}
              className={cn(
                "flex min-h-12 w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-semibold tracking-wide transition-colors",
                moreSheetOpen || moreActive
                  ? "bg-navy text-cream"
                  : "text-navy/60 hover:bg-sand hover:text-navy",
              )}
              aria-expanded={moreSheetOpen}
              aria-haspopup="dialog"
            >
              <Ellipsis className="size-[1.15rem]" aria-hidden />
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>

      {moreSheetOpen ? (
        <div
          className="fixed inset-0 z-[60] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="More member pages"
        >
          <button
            type="button"
            className="absolute inset-0 bg-navy/35 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[1.35rem] border border-border bg-cream shadow-[0_-18px_50px_rgba(47,56,38,0.18)]">
            <div className="flex justify-center pt-3">
              <span className="h-1 w-10 rounded-full bg-navy/20" aria-hidden />
            </div>
            <div className="px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-navy/45 uppercase">
                More
              </p>
              <ul className="mt-3 space-y-1">
                {moreMobile.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
                          active
                            ? "bg-navy text-cream"
                            : "text-navy/80 hover:bg-sand",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-9 items-center justify-center rounded-xl",
                            active ? "bg-white/15" : "bg-white",
                          )}
                        >
                          <Icon className="size-4" aria-hidden />
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
