"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MemberCard } from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { practiceCopy } from "@/content/site";
import {
  applyAudioOutputDevice,
  buildMockCallAudioInputConstraints,
  canSelectAudioOutput,
  getMockCallAudioDevicePrefs,
  setMockCallAudioDevicePrefs,
} from "@/lib/practice/mock-call/audio-device-prefs";
import { playAudioBlobWithPrefs } from "@/lib/practice/mock-call/play-audio-blob";

const MIC_TEST_MAX_MS = 10_000;

function pickMimeType() {
  return MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
}

type Props = {
  onBackToHub: () => void;
};

export function MockCallAudioSetupPanel({ onBackToHub }: Props) {
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);
  const [micId, setMicId] = useState("");
  const [speakerId, setSpeakerId] = useState("");
  const [micDenied, setMicDenied] = useState(false);
  const [recording, setRecording] = useState(false);
  const [testBlob, setTestBlob] = useState<Blob | null>(null);
  const [speakerTesting, setSpeakerTesting] = useState(false);
  const [busy, setBusy] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const stopTimerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    setInputs(devices.filter((d) => d.kind === "audioinput"));
    setOutputs(devices.filter((d) => d.kind === "audiooutput"));
  }, []);

  useEffect(() => {
    const prefs = getMockCallAudioDevicePrefs();
    setMicId(prefs.micDeviceId);
    setSpeakerId(prefs.speakerDeviceId);
    void (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMicDenied(true);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setMicDenied(false);
        await refreshDevices();
      } catch {
        setMicDenied(true);
      }
    })();
  }, [refreshDevices]);

  const onMicChange = (id: string) => {
    setMicId(id);
    setMockCallAudioDevicePrefs({ micDeviceId: id });
  };

  const onSpeakerChange = (id: string) => {
    setSpeakerId(id);
    setMockCallAudioDevicePrefs({ speakerDeviceId: id });
  };

  const stopMicTest = useCallback(async () => {
    if (stopTimerRef.current != null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setRecording(false);
      return;
    }
    await new Promise<void>((resolve) => {
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size > 0) setTestBlob(blob);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        resolve();
      };
      recorder.stop();
    });
  }, []);

  const startMicTest = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || recording) return;
    setBusy(true);
    setTestBlob(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: buildMockCallAudioInputConstraints(micId || undefined),
      });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(500);
      recorderRef.current = recorder;
      setRecording(true);
      setMicDenied(false);
      stopTimerRef.current = window.setTimeout(() => {
        void stopMicTest();
      }, MIC_TEST_MAX_MS);
    } catch {
      setMicDenied(true);
    } finally {
      setBusy(false);
    }
  }, [micId, recording, stopMicTest]);

  const playMicTest = useCallback(async () => {
    if (!testBlob) return;
    setBusy(true);
    try {
      await playAudioBlobWithPrefs(testBlob);
    } finally {
      setBusy(false);
    }
  }, [testBlob]);

  const playSpeakerTest = useCallback(async () => {
    if (speakerTesting) return;
    setSpeakerTesting(true);
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const dest = ctx.createMediaStreamDestination();
      osc.frequency.value = 440;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(dest);
      const audio = new Audio();
      audio.srcObject = dest.stream;
      if (speakerId) await applyAudioOutputDevice(audio, speakerId);
      await audio.play();
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
      await new Promise<void>((resolve) => {
        window.setTimeout(() => {
          void ctx.close();
          resolve();
        }, 700);
      });
    } finally {
      setSpeakerTesting(false);
    }
  }, [speakerId, speakerTesting]);

  useEffect(() => {
    return () => {
      if (stopTimerRef.current != null) window.clearTimeout(stopTimerRef.current);
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">
          {practiceCopy.mockCallAudioSetupTitle}
        </h2>
        <p className="mt-1 text-sm text-muted">{practiceCopy.mockCallAudioSetupLead}</p>
      </div>

      {micDenied ? (
        <p className="text-sm text-destructive" role="alert">
          {practiceCopy.mockCallAudioSetupMicDenied}
        </p>
      ) : null}

      <MemberCard className="space-y-4 p-4">
        <div>
          <Label htmlFor="mock-call-mic-select">{practiceCopy.mockCallAudioSetupMicLabel}</Label>
          <select
            id="mock-call-mic-select"
            className="mt-2 h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-ink"
            value={micId}
            onChange={(e) => onMicChange(e.target.value)}
          >
            <option value="">{practiceCopy.mockCallAudioSetupDefaultDevice}</option>
            {inputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || practiceCopy.mockCallAudioSetupMicLabel}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {!recording ? (
            <Button
              type="button"
              variant="accent"
              size="sm"
              disabled={busy || micDenied}
              onClick={() => void startMicTest()}
            >
              {practiceCopy.mockCallAudioSetupRecordTest}
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void stopMicTest()}
            >
              {practiceCopy.mockCallAudioSetupStopTest}
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!testBlob || busy || recording}
            onClick={() => void playMicTest()}
          >
            {practiceCopy.mockCallAudioSetupPlayTest}
          </Button>
        </div>

        <div className="border-t border-border pt-4">
          <Label htmlFor="mock-call-speaker-select">
            {practiceCopy.mockCallAudioSetupSpeakerLabel}
          </Label>
          <select
            id="mock-call-speaker-select"
            className="mt-2 h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-ink"
            value={speakerId}
            onChange={(e) => onSpeakerChange(e.target.value)}
            disabled={!canSelectAudioOutput()}
          >
            <option value="">{practiceCopy.mockCallAudioSetupDefaultDevice}</option>
            {outputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || practiceCopy.mockCallAudioSetupSpeakerLabel}
              </option>
            ))}
          </select>
          {!canSelectAudioOutput() ? (
            <p className="mt-2 text-xs text-muted">
              {practiceCopy.mockCallSpeakerSelectUnsupported}
            </p>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            disabled={speakerTesting}
            onClick={() => void playSpeakerTest()}
          >
            {speakerTesting
              ? practiceCopy.mockCallAudioSetupSpeakerPlaying
              : practiceCopy.mockCallAudioSetupPlaySpeakerTest}
          </Button>
        </div>

        <p className="text-xs text-muted">{practiceCopy.mockCallAudioSetupSavedNote}</p>
      </MemberCard>

      <Button type="button" variant="secondary" onClick={onBackToHub}>
        {practiceCopy.mockCallBackToHub}
      </Button>
    </div>
  );
}
