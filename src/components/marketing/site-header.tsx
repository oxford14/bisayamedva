"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";
import { nav, site } from "@/content/site";
import { formatPeso } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const price = formatPeso(site.featuredCourse.price);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-navy/8 bg-cream/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-[4.25rem]">
        <Logo />
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {nav.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-navy/75 transition-colors hover:text-navy cursor-pointer"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="ghost" asChild>
            <Link href={nav.login.href}>{nav.login.label}</Link>
          </Button>
          <Button variant="accent" asChild>
            <Link href={nav.register.href}>
              {nav.register.label} — {price}
            </Link>
          </Button>
        </div>
        <button
          type="button"
          className="inline-flex size-11 cursor-pointer items-center justify-center rounded-[10px] text-navy lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </Container>
      {open ? (
        <div id="mobile-nav" className="border-t border-navy/8 bg-cream lg:hidden">
          <Container className="flex flex-col gap-2 py-4">
            {nav.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-[10px] px-3 py-3 text-base font-medium text-navy hover:bg-sand cursor-pointer"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={nav.login.href}
              onClick={() => setOpen(false)}
              className="rounded-[10px] px-3 py-3 text-base font-medium text-navy hover:bg-sand cursor-pointer"
            >
              {nav.login.label}
            </Link>
            <Button variant="accent" className="mt-2 w-full" asChild>
              <Link href={nav.register.href} onClick={() => setOpen(false)}>
                {nav.register.label} — {price}
              </Link>
            </Button>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
