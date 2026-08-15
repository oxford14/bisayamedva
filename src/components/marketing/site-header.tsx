"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";
import { nav } from "@/content/site";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-navy/6 bg-white/95 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
        <Logo />
        <nav
          className="hidden items-center gap-9 lg:flex"
          aria-label="Primary"
        >
          {nav.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative text-[11px] font-semibold tracking-[0.18em] text-navy/70 uppercase transition-colors hover:text-navy cursor-pointer"
            >
              {link.label}
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 bg-teal-bright transition-transform duration-300 group-hover:scale-x-100"
              />
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <Button
            variant="ghost"
            className="text-[11px] font-semibold tracking-[0.16em] uppercase"
            asChild
          >
            <Link href={nav.login.href}>{nav.login.label}</Link>
          </Button>
          <Button
            variant="accent"
            className="rounded-md px-6 text-[11px] font-bold tracking-[0.16em] uppercase shadow-none"
            asChild
          >
            <Link href={nav.register.href}>{nav.register.label}</Link>
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
        <div
          id="mobile-nav"
          className="border-t border-navy/8 bg-white lg:hidden"
        >
          <Container className="flex flex-col gap-1 py-4">
            {nav.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-[10px] px-3 py-3 text-sm font-semibold tracking-[0.12em] text-navy uppercase hover:bg-sand cursor-pointer"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={nav.login.href}
              onClick={() => setOpen(false)}
              className="rounded-[10px] px-3 py-3 text-sm font-semibold tracking-[0.12em] text-navy uppercase hover:bg-sand cursor-pointer"
            >
              {nav.login.label}
            </Link>
            <Button
              variant="accent"
              className="mt-2 w-full rounded-md text-[11px] font-bold tracking-[0.16em] uppercase shadow-none"
              asChild
            >
              <Link href={nav.register.href} onClick={() => setOpen(false)}>
                {nav.register.label}
              </Link>
            </Button>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
