import { loadDotEnvForScripts } from "./load-env-for-scripts";

loadDotEnvForScripts();

const key = process.env.ELEVENLABS_API_KEY?.trim();
if (!key) {
  console.error("Missing ELEVENLABS_API_KEY in .env");
  process.exit(1);
}

async function main() {
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": key! },
  });

  if (!res.ok) {
    console.error("List voices failed:", res.status, await res.text());
    process.exit(1);
  }

  const data = (await res.json()) as {
    voices?: Array<{
      voice_id: string;
      name: string;
      category?: string;
    }>;
  };

  for (const v of data.voices ?? []) {
    console.log(`${v.voice_id}\t${v.category ?? ""}\t${v.name}`);
  }
}

void main();
