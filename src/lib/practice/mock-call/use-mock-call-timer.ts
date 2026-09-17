"use client";

import { useEffect, useState } from "react";

function formatElapsedMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function useMockCallTimer(startedAt: string): string {
  const [elapsed, setElapsed] = useState(() =>
    formatElapsedMs(Date.now() - new Date(startedAt).getTime()),
  );

  useEffect(() => {
    const startMs = new Date(startedAt).getTime();
    const tick = () => {
      setElapsed(formatElapsedMs(Date.now() - startMs));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  return elapsed;
}
