import { NextResponse } from "next/server";
import { ELEVENLABS_TTS_MAX_CHARS } from "@/lib/elevenlabs/config";
import {
  ElevenLabsConfigError,
  synthesizeSpeech,
} from "@/lib/elevenlabs/tts";
import { canAccessPracticeLab } from "@/lib/member/practice-access";
import { getCurrentProfile } from "@/lib/supabase/auth";

type TtsBody = {
  text?: string;
  voiceId?: string;
};

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!canAccessPracticeLab(profile.role)) {
    return NextResponse.json({ error: "Practice Lab access required." }, {
      status: 403,
    });
  }

  let body: TtsBody;
  try {
    body = (await request.json()) as TtsBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text is required." }, { status: 400 });
  }
  if (text.length > ELEVENLABS_TTS_MAX_CHARS) {
    return NextResponse.json(
      { error: `text must be at most ${ELEVENLABS_TTS_MAX_CHARS} characters.` },
      { status: 400 },
    );
  }

  const voiceId =
    typeof body.voiceId === "string" && body.voiceId.trim()
      ? body.voiceId.trim()
      : undefined;

  try {
    const audio = await synthesizeSpeech({ text, voiceId });
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    if (err instanceof ElevenLabsConfigError) {
      return NextResponse.json(
        {
          error:
            "Caller audio wala available — i-set ang ELEVENLABS_API_KEY ug ELEVENLABS_VOICE_ID sa server.",
        },
        { status: 503 },
      );
    }
    const message =
      err instanceof Error ? err.message : "Could not synthesize speech.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
