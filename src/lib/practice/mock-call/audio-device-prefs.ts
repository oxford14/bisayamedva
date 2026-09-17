"use client";

const MIC_KEY = "mockCallMicDeviceId";
const SPEAKER_KEY = "mockCallSpeakerDeviceId";

export type MockCallAudioDevicePrefs = {
  micDeviceId: string;
  speakerDeviceId: string;
};

export function getMockCallAudioDevicePrefs(): MockCallAudioDevicePrefs {
  if (typeof window === "undefined") {
    return { micDeviceId: "", speakerDeviceId: "" };
  }
  return {
    micDeviceId: localStorage.getItem(MIC_KEY) ?? "",
    speakerDeviceId: localStorage.getItem(SPEAKER_KEY) ?? "",
  };
}

export function setMockCallAudioDevicePrefs(
  partial: Partial<MockCallAudioDevicePrefs>,
) {
  if (typeof window === "undefined") return;
  if (partial.micDeviceId !== undefined) {
    if (partial.micDeviceId) localStorage.setItem(MIC_KEY, partial.micDeviceId);
    else localStorage.removeItem(MIC_KEY);
  }
  if (partial.speakerDeviceId !== undefined) {
    if (partial.speakerDeviceId) {
      localStorage.setItem(SPEAKER_KEY, partial.speakerDeviceId);
    } else localStorage.removeItem(SPEAKER_KEY);
  }
}

export function buildMockCallAudioInputConstraints(
  deviceId?: string,
): boolean | MediaTrackConstraints {
  if (deviceId) {
    return { deviceId: { ideal: deviceId } };
  }
  return true;
}

type AudioElementWithSink = HTMLAudioElement & {
  setSinkId?: (sinkId: string) => Promise<void>;
};

export function canSelectAudioOutput(): boolean {
  if (typeof document === "undefined") return false;
  const probe = document.createElement("audio") as AudioElementWithSink;
  return typeof probe.setSinkId === "function";
}

export async function applyAudioOutputDevice(
  audio: HTMLAudioElement,
  deviceId?: string,
): Promise<boolean> {
  const el = audio as AudioElementWithSink;
  if (!deviceId || typeof el.setSinkId !== "function") return false;
  try {
    await el.setSinkId(deviceId);
    return true;
  } catch {
    return false;
  }
}
