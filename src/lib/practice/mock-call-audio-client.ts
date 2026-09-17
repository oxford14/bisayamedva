"use client";

import {
  MOCK_CALL_MANIFEST_PATH,
  type MockCallAudioManifest,
} from "@/lib/practice/mock-call/audio-keys";

let manifestCache: MockCallAudioManifest | null = null;
let manifestPromise: Promise<MockCallAudioManifest | null> | null = null;

const blobCache = new Map<string, Blob>();

export function resetMockCallAudioCache() {
  manifestCache = null;
  manifestPromise = null;
  blobCache.clear();
}

function manifestUrl(): string {
  return `${MOCK_CALL_MANIFEST_PATH}?v=${Date.now()}`;
}

function isValidAudioBlob(blob: Blob): boolean {
  if (blob.size < 512) return false;
  const type = blob.type.toLowerCase();
  return type.includes("audio") || type === "application/octet-stream";
}

export async function loadMockCallManifest(
  options?: { bypassCache?: boolean },
): Promise<MockCallAudioManifest | null> {
  if (options?.bypassCache) {
    resetMockCallAudioCache();
  }
  if (manifestCache) return manifestCache;
  if (manifestPromise) return manifestPromise;

  manifestPromise = fetch(manifestUrl(), { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) return null;
      const json = (await res.json()) as MockCallAudioManifest;
      if (!json.clips || typeof json.clips !== "object") return null;
      const clipCount = Object.keys(json.clips).length;
      if (clipCount === 0) return null;
      manifestCache = json;
      return json;
    })
    .catch(() => null)
    .finally(() => {
      manifestPromise = null;
    });

  return manifestPromise;
}

export function getCachedCallerBlob(clipKey: string): Blob | undefined {
  const blob = blobCache.get(clipKey);
  if (blob && isValidAudioBlob(blob)) return blob;
  return undefined;
}

async function fetchClipFromUrl(
  clipKey: string,
  url: string,
): Promise<Blob | null> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) return null;
  const blob = await res.blob();
  if (!isValidAudioBlob(blob)) return null;
  blobCache.set(clipKey, blob);
  return blob;
}

export async function fetchCallerClipBlob(
  clipKey: string,
): Promise<Blob | null> {
  const cached = getCachedCallerBlob(clipKey);
  if (cached) return cached;

  const manifest = await loadMockCallManifest();
  const url = manifest?.clips[clipKey];
  if (!url) return null;

  return fetchClipFromUrl(clipKey, url);
}

/** Prefetch all bundled caller clips when Mock Call opens (browser cache). */
export async function prefetchAllMockCallAudio(): Promise<{
  total: number;
  loaded: number;
}> {
  resetMockCallAudioCache();
  const manifest = await loadMockCallManifest();
  if (!manifest) return { total: 0, loaded: 0 };

  const entries = Object.entries(manifest.clips);
  let loaded = 0;

  await Promise.all(
    entries.map(async ([key, url]) => {
      try {
        const blob = await fetchClipFromUrl(key, url);
        if (blob) loaded += 1;
      } catch {
        /* skip failed clip */
      }
    }),
  );

  return { total: entries.length, loaded };
}
