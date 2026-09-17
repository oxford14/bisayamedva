"use client";

function pickRecorderMimeType(): string {
  if (typeof MediaRecorder !== "undefined") {
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
      return "audio/webm;codecs=opus";
    }
    if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
    if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  }
  return "audio/webm";
}

async function decodeAudioBlob(
  ctx: AudioContext,
  blob: Blob,
): Promise<AudioBuffer | null> {
  try {
    const data = await blob.arrayBuffer();
    return await ctx.decodeAudioData(data.slice(0));
  } catch {
    return null;
  }
}

async function concatAudioBuffers(
  buffers: AudioBuffer[],
): Promise<AudioBuffer | null> {
  if (buffers.length === 0) return null;
  const sampleRate = buffers[0].sampleRate;
  const channels = Math.max(...buffers.map((b) => b.numberOfChannels));
  let totalLength = 0;
  for (const b of buffers) {
    totalLength += b.length;
  }
  const offline = new OfflineAudioContext(channels, totalLength, sampleRate);
  let when = 0;
  for (const buffer of buffers) {
    const source = offline.createBufferSource();
    source.buffer = buffer;
    source.connect(offline.destination);
    source.start(when);
    when += buffer.duration;
  }
  return offline.startRendering();
}

async function encodeBufferToBlob(
  ctx: AudioContext,
  buffer: AudioBuffer,
): Promise<Blob | null> {
  if (typeof MediaRecorder === "undefined") return null;
  const dest = ctx.createMediaStreamDestination();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(dest);
  const mimeType = pickRecorderMimeType();
  const recorder = new MediaRecorder(dest.stream, { mimeType });
  const chunks: BlobPart[] = [];

  return new Promise((resolve) => {
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      if (chunks.length === 0) {
        resolve(null);
        return;
      }
      resolve(new Blob(chunks, { type: mimeType.split(";")[0] ?? "audio/webm" }));
    };
    recorder.onerror = () => resolve(null);
    recorder.start(100);
    source.start(0);
    source.onended = () => {
      if (recorder.state === "recording") recorder.stop();
    };
  });
}

export async function mergeConversationBlobs(
  blobs: Blob[],
): Promise<Blob | null> {
  if (blobs.length === 0) return null;
  if (blobs.length === 1) return blobs[0];

  const ctx = new AudioContext();
  try {
    const decoded: AudioBuffer[] = [];
    for (const blob of blobs) {
      const buf = await decodeAudioBlob(ctx, blob);
      if (buf) decoded.push(buf);
    }
    if (decoded.length === 0) return null;
    const merged = await concatAudioBuffers(decoded);
    if (!merged) return null;
    return encodeBufferToBlob(ctx, merged);
  } finally {
    void ctx.close();
  }
}

export function conversationDownloadFilename(
  scenarioId: string,
  startedAt: string,
  blob: Blob,
): string {
  const date = startedAt.slice(0, 10);
  const ext = blob.type.includes("mp4") ? "m4a" : "webm";
  const safeId = scenarioId.replace(/[^a-z0-9-]+/gi, "-");
  return `mock-call-${safeId}-${date}.${ext}`;
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
