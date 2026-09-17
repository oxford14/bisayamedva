"use client";

export async function fetchCallerTtsAudio(
  text: string,
  voiceId?: string,
): Promise<ArrayBuffer | null> {
  const response = await fetch("/api/practice/elevenlabs/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId }),
  });

  if (response.status === 503) {
    return null;
  }

  if (!response.ok) {
    let detail = "Could not play caller audio.";
    try {
      const json = (await response.json()) as { error?: string };
      if (json.error) detail = json.error;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  return response.arrayBuffer();
}
