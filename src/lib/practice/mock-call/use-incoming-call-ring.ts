"use client";

import { useEffect, useRef } from "react";

const RING_ON_MS = 1600;
const RING_CYCLE_MS = 4000;
const TONE_A_HZ = 440;
const TONE_B_HZ = 480;
const GAIN = 0.06;

/** Call from Start mock call click so ring audio is allowed in the browser. */
export function primeIncomingCallAudio() {
  const ctx = new AudioContext();
  void ctx.resume().then(() => ctx.close());
}

/** Classic dual-tone office ring loop while incoming-call UI is shown. */
export function useIncomingCallRing(active: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) return;

    const ctx = new AudioContext();
    ctxRef.current = ctx;
    void ctx.resume();

    const playBurst = () => {
      if (ctx.state === "closed") return;
      const t0 = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(GAIN, t0 + 0.02);
      gain.gain.setValueAtTime(GAIN, t0 + RING_ON_MS / 1000 - 0.05);
      gain.gain.linearRampToValueAtTime(0, t0 + RING_ON_MS / 1000);
      gain.connect(ctx.destination);

      for (const freq of [TONE_A_HZ, TONE_B_HZ]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start(t0);
        osc.stop(t0 + RING_ON_MS / 1000);
      }
    };

    playBurst();
    intervalRef.current = setInterval(playBurst, RING_CYCLE_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      void ctx.close();
      ctxRef.current = null;
    };
  }, [active]);
}
