export const ELEVENLABS_TTS_MAX_CHARS = 2000;

export function getElevenLabsApiKey(): string | null {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  return key || null;
}

export function getElevenLabsDefaultVoiceId(): string | null {
  const id = process.env.ELEVENLABS_VOICE_ID?.trim();
  return id || null;
}

export function getElevenLabsModelId(): string {
  return (
    process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_multilingual_v2"
  );
}

/** Premade voice that works on free-tier API (Sarah). Override with ELEVENLABS_CALLER_VOICE_ID. */
export const DEFAULT_MOCK_CALL_CALLER_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

/** Voice for bundled Mock Call caller MP3s (not live per-student TTS). */
export function getMockCallCallerVoiceId(): string {
  return (
    process.env.ELEVENLABS_CALLER_VOICE_ID?.trim() ||
    DEFAULT_MOCK_CALL_CALLER_VOICE_ID
  );
}
