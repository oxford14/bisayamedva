/**
 * Generates caller MP3s for all Mock Call scenarios (run after script changes).
 * Requires ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { mockCallScenarios } from "../src/lib/practice/mock-call-scenarios";
import {
  listAllCallerClipsForScenario,
  publicUrlForClip,
  type MockCallAudioManifest,
} from "../src/lib/practice/mock-call/audio-keys";
import { getMockCallCallerVoiceId } from "../src/lib/elevenlabs/config";
import { synthesizeSpeech } from "../src/lib/elevenlabs/tts";
import { loadDotEnvForScripts } from "./load-env-for-scripts";

function voiceIdFromArgs(): string | undefined {
  const arg = process.argv.find((a) => a.startsWith("--voice="));
  return arg?.slice("--voice=".length).trim() || undefined;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  loadDotEnvForScripts();
  if (process.argv.includes("--force")) {
    process.env.FORCE_MOCK_CALL_AUDIO = "1";
  }
  const cliVoice = voiceIdFromArgs();
  if (cliVoice) process.env.ELEVENLABS_CALLER_VOICE_ID = cliVoice;

  const callerVoiceId = getMockCallCallerVoiceId();
  console.log(`Using caller voice_id: ${callerVoiceId}`);

  const publicRoot = path.join(process.cwd(), "public");
  let failures = 0;
  const manifestClips: MockCallAudioManifest["clips"] = {};
  let count = 0;

  for (const scenario of mockCallScenarios) {
    const clips = listAllCallerClipsForScenario(scenario);
    for (const clip of clips) {
      const outDir = path.join(publicRoot, path.dirname(clip.relativePath));
      mkdirSync(outDir, { recursive: true });
      const outFile = path.join(publicRoot, clip.relativePath);

      if (existsSync(outFile) && process.env.FORCE_MOCK_CALL_AUDIO !== "1") {
        manifestClips[clip.clipKey] = publicUrlForClip(clip.relativePath);
        count += 1;
        console.log(`skip (exists) ${clip.clipKey}`);
        continue;
      }

      console.log(`synthesizing ${clip.clipKey}…`);
      try {
        const buffer = await synthesizeSpeech({
          text: clip.text,
          voiceId: scenario.voiceId ?? callerVoiceId,
        });
        writeFileSync(outFile, Buffer.from(buffer));
        manifestClips[clip.clipKey] = publicUrlForClip(clip.relativePath);
        count += 1;
      } catch (err) {
        failures += 1;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`failed ${clip.clipKey}: ${msg.slice(0, 200)}`);
        if (msg.includes("402") || msg.includes("paid_plan")) {
          console.error(
            "\nElevenLabs blocked this voice on your plan. Use a voice from your account that API access allows, or upgrade. Try: npm run generate:mock-call-audio -- --voice=YOUR_VOICE_ID\n",
          );
          process.exit(1);
        }
      }
      await sleep(250);
    }
  }

  const manifest: MockCallAudioManifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    clips: manifestClips,
  };

  const manifestPath = path.join(
    publicRoot,
    "practice/mock-call/manifest.json",
  );
  mkdirSync(path.dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Done — ${count} clips in manifest (${failures} failures).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
