"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

type ShellNavLinkProps = {
  href: string;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
};

export function ShellNavLink({
  href,
  className,
  onClick,
  children,
}: ShellNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(className, "group/nav")}
    >
      <ShellNavLinkPending>{children}</ShellNavLinkPending>
    </Link>
  );
}

function ShellNavLinkPending({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <span
      className={cn("contents", pending && "opacity-70 transition-opacity")}
      aria-busy={pending || undefined}
    >
      {children}
    </span>
  );
}
