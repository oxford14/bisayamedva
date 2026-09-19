"use client";

import { useEffect, useRef, useState } from "react";
import { hipaaCopy } from "@/content/site";
import { HIPAA_EXTERNAL_URL } from "@/lib/member/hipaa-gate";

const SESSION_KEY = "hipaa-module1-opened";

type Props = {
  autoLaunch?: boolean;
  launchSessionKey?: string;
};

const HASH_JUMP_MS = [700, 1800] as const;

export function HipaaTrainingEmbed({
  autoLaunch = false,
  launchSessionKey = SESSION_KEY,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hashJumpDoneRef = useRef(false);
  const hashJumpTimersRef = useRef<number[]>([]);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!autoLaunch) return;
    if (sessionStorage.getItem(launchSessionKey) === "1") return;
    sessionStorage.setItem(launchSessionKey, "1");
    window.open(HIPAA_EXTERNAL_URL, "_blank", "noopener,noreferrer");
  }, [autoLaunch, launchSessionKey]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const frame = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    setIframeSrc("about:blank");
    const frame = requestAnimationFrame(() => {
      setIframeSrc(HIPAA_EXTERNAL_URL);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const nudgeIframeToModule1 = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.src = HIPAA_EXTERNAL_URL;
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframeSrc || iframeSrc === "about:blank") return;

    const onLoad = () => {
      try {
        const win = iframe.contentWindow;
        if (!win) return;
        const current = win.location.href;
        if (!current.includes("#module1")) {
          win.location.replace(HIPAA_EXTERNAL_URL);
        }
      } catch {
        // Cross-origin: cannot scroll inside the partner page — re-apply #module1 on src after load.
        if (hashJumpDoneRef.current) return;
        hashJumpDoneRef.current = true;
        for (const ms of HASH_JUMP_MS) {
          hashJumpTimersRef.current.push(
            window.setTimeout(() => {
              nudgeIframeToModule1();
            }, ms),
          );
        }
      }
    };

    iframe.addEventListener("load", onLoad);
    return () => {
      iframe.removeEventListener("load", onLoad);
      for (const id of hashJumpTimersRef.current) window.clearTimeout(id);
      hashJumpTimersRef.current = [];
    };
  }, [iframeSrc]);

  return (
    <div
      ref={containerRef}
      className="scroll-mt-20 overflow-hidden rounded-2xl border border-border bg-white"
    >
      <iframe
        ref={iframeRef}
        title={hipaaCopy.stepTitle}
        src={iframeSrc ?? "about:blank"}
        className="h-[min(640px,72vh)] w-full"
        referrerPolicy="no-referrer"
      />
      <p className="border-t border-border px-4 py-2 text-xs text-muted">
        {hipaaCopy.iframeHint}{" "}
        <a
          href={HIPAA_EXTERNAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-navy underline"
        >
          {hipaaCopy.openModule1Link}
        </a>
      </p>
    </div>
  );
}
