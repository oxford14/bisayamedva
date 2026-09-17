import {
  getElevenLabsApiKey,
  getElevenLabsDefaultVoiceId,
  getElevenLabsModelId,
} from "@/lib/elevenlabs/config";

export type ElevenLabsTtsOptions = {
  text: string;
  voiceId?: string;
};

export class ElevenLabsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ElevenLabsConfigError";
  }
}

export async function synthesizeSpeech(
  options: ElevenLabsTtsOptions,
): Promise<ArrayBuffer> {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    throw new ElevenLabsConfigError("ELEVENLABS_API_KEY is not configured.");
  }

  const voiceId = options.voiceId?.trim() || getElevenLabsDefaultVoiceId();
  if (!voiceId) {
    throw new ElevenLabsConfigError("ELEVENLABS_VOICE_ID is not configured.");
  }

  const modelId = getElevenLabsModelId();
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: options.text,
      model_id: modelId,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs TTS failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
    );
  }

  return response.arrayBuffer();
}
