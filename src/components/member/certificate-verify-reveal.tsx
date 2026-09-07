"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { certificatesCopy } from "@/content/site";

export function CertificateVerifyReveal({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setReady(true);
      return;
    }
    const timer = window.setTimeout(() => setReady(true), 1600);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[22rem] w-full max-w-lg flex-col items-center justify-center px-6 py-12 text-center">
        <div className="relative flex size-24 items-center justify-center">
          <span
            aria-hidden
            className="animate-cert-ring absolute inset-0 rounded-full border border-navy/50"
          />
          <span
            aria-hidden
            className="absolute inset-2 rounded-full border border-navy/20"
          />
          <Image
            src="/images/brand/logo-mark.png"
            alt=""
            width={56}
            height={56}
            className="relative size-11 object-contain"
          />
        </div>
        <p className="mt-6 text-[11px] font-semibold tracking-[0.22em] text-navy/70 uppercase">
          {certificatesCopy.authenticating}
        </p>
        <div className="mt-5 h-px w-40 overflow-hidden bg-navy/10">
          <div className="animate-cert-bar h-full w-full bg-navy/70" />
        </div>
      </div>
    );
  }

  return <div className="animate-cert-fade w-full max-w-lg">{children}</div>;
}
