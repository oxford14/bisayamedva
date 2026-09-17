"use client";

import {
  applyAudioOutputDevice,
  getMockCallAudioDevicePrefs,
} from "@/lib/practice/mock-call/audio-device-prefs";

export async function playAudioBlobWithPrefs(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  const { speakerDeviceId } = getMockCallAudioDevicePrefs();
  if (speakerDeviceId) {
    await applyAudioOutputDevice(audio, speakerDeviceId);
  }
  await new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Playback failed."));
    };
    void audio.play().catch((err) => {
      URL.revokeObjectURL(url);
      reject(err);
    });
  });
}
