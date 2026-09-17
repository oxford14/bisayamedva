"use client";

/** Fallback when bundled MP3s are missing (e.g. before generate script or API plan limits). */
export function speakCallerLineInBrowser(text: string): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.reject(new Error("Browser speech is not available."));
  }

  return new Promise((resolve, reject) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.95;
    utter.onend = () => resolve();
    utter.onerror = () => reject(new Error("Browser speech playback failed."));
    window.speechSynthesis.speak(utter);
  });
}
