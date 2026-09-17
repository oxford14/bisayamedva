"use client";

const MERGE_SAMPLE_RATE = 48000;

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

export type MergeConversationProgress = {
  phase: "decode" | "merge" | "encode";
  current: number;
  total: number;
};

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
  const channels = Math.max(...buffers.map((b) => b.numberOfChannels));
  let totalLength = 0;
  for (const b of buffers) {
    totalLength += Math.ceil(b.duration * MERGE_SAMPLE_RATE);
  }
  const offline = new OfflineAudioContext(
    channels,
    totalLength,
    MERGE_SAMPLE_RATE,
  );
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

function encodeBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = length * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i] ?? 0));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

async function encodeBufferToWebm(
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

  const timeoutMs = Math.min(
    120_000,
    Math.max(15_000, (buffer.duration + 8) * 1000),
  );

  return new Promise((resolve) => {
    let settled = false;
    const finish = (blob: Blob | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(blob);
    };

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      if (chunks.length === 0) {
        finish(null);
        return;
      }
      finish(
        new Blob(chunks, { type: mimeType.split(";")[0] ?? "audio/webm" }),
      );
    };
    recorder.onerror = () => finish(null);

    const timer = window.setTimeout(() => {
      try {
        if (recorder.state === "recording") {
          recorder.requestData();
          recorder.stop();
        }
      } catch {
        finish(null);
      }
    }, timeoutMs);

    try {
      recorder.start(100);
      source.start(0);
      source.onended = () => {
        try {
          if (recorder.state === "recording") {
            recorder.requestData();
            recorder.stop();
          }
        } catch {
          finish(null);
        }
      };
    } catch {
      finish(null);
    }
  });
}

async function encodeMergedBuffer(
  ctx: AudioContext,
  buffer: AudioBuffer,
): Promise<Blob> {
  const webm = await encodeBufferToWebm(ctx, buffer);
  if (webm) return webm;
  return encodeBufferToWav(buffer);
}

export async function mergeConversationBlobs(
  blobs: Blob[],
  onProgress?: (p: MergeConversationProgress) => void,
): Promise<Blob | null> {
  if (blobs.length === 0) return null;
  if (blobs.length === 1) {
    onProgress?.({ phase: "encode", current: 1, total: 1 });
    return blobs[0];
  }

  const ctx = new AudioContext();
  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const decoded: AudioBuffer[] = [];
    const total = blobs.length;
    for (let i = 0; i < blobs.length; i++) {
      const buf = await decodeAudioBlob(ctx, blobs[i]!);
      if (buf) decoded.push(buf);
      onProgress?.({ phase: "decode", current: i + 1, total });
    }
    if (decoded.length === 0) return null;

    onProgress?.({ phase: "merge", current: 1, total: 1 });
    const merged = await concatAudioBuffers(decoded);
    if (!merged) return null;

    onProgress?.({ phase: "encode", current: 0, total: 1 });
    const encoded = await encodeMergedBuffer(ctx, merged);
    onProgress?.({ phase: "encode", current: 1, total: 1 });
    return encoded;
  } finally {
    await ctx.close();
  }
}

export function conversationDownloadFilename(
  scenarioId: string,
  startedAt: string,
  blob: Blob,
): string {
  const date = startedAt.slice(0, 10);
  let ext = "webm";
  if (blob.type.includes("wav")) ext = "wav";
  else if (blob.type.includes("mp4")) ext = "m4a";
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
