"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { adminNav } from "@/components/admin/nav-config";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { AdminProfile } from "@/lib/supabase/auth";

export function AdminShell({
  profile,
  children,
}: {
  profile: AdminProfile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const items = adminNav.filter(
    (item) =>
      !("superAdminOnly" in item && item.superAdminOnly) ||
      profile.role === "SUPER_ADMIN",
  );

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href, "exact" in item ? item.exact : false);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
              active
                ? "bg-navy text-cream"
                : "text-navy/75 hover:bg-sand hover:text-navy",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-cream text-ink">
      <div className="mx-auto flex min-h-dvh max-w-[1600px]">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-white lg:flex">
          <div className="border-b border-border px-4 py-4">
            <Logo />
            <p className="mt-2 text-[10px] font-semibold tracking-[0.18em] text-navy/45 uppercase">
              Admin
            </p>
          </div>
          {nav}
          <div className="border-t border-border p-4">
            <p className="truncate text-sm font-semibold text-ink">{profile.full_name}</p>
            <p className="truncate text-xs text-muted">{profile.email}</p>
            <p className="mt-1 text-[10px] font-semibold tracking-wide text-navy/50 uppercase">
              {profile.role.replaceAll("_", " ")}
            </p>
            <button
              type="button"
              onClick={signOut}
              className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-navy/70 hover:text-navy"
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur lg:hidden">
            <Logo />
            <button
              type="button"
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-xl text-navy"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </header>

          {open ? (
            <div className="border-b border-border bg-white lg:hidden">
              {nav}
              <div className="border-t border-border p-4">
                <p className="text-sm font-semibold">{profile.full_name}</p>
                <button
                  type="button"
                  onClick={signOut}
                  className="mt-2 text-sm font-medium text-navy/70 cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : null}

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
