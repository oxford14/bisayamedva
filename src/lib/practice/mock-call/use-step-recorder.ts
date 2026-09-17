"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CallFlowStepId } from "@/lib/practice/call-flow";
import {
  buildMockCallAudioInputConstraints,
  getMockCallAudioDevicePrefs,
} from "@/lib/practice/mock-call/audio-device-prefs";

/** Call flow step id or dialogue page recording key (e.g. opening__p0). */
export type MockCallRecordingKey = CallFlowStepId | string;

function pickMimeType() {
  return MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
}

export function useStepRecorder() {
  const [recordingStepId, setRecordingStepId] =
    useState<MockCallRecordingKey | null>(null);
  const [stepBlobs, setStepBlobs] = useState<Map<MockCallRecordingKey, Blob>>(
    () => new Map(),
  );
  const [micDenied, setMicDenied] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const activeStepRef = useRef<MockCallRecordingKey | null>(null);

  const stopActiveRecorder = useCallback(async (): Promise<{
    stepId: MockCallRecordingKey;
    blob: Blob;
  } | null> => {
    const recorder = recorderRef.current;
    const stepId = activeStepRef.current;
    if (!recorder || recorder.state === "inactive" || !stepId) {
      return null;
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        for (const track of recorder.stream.getTracks()) {
          track.stop();
        }
        recorderRef.current = null;
        activeStepRef.current = null;
        setRecordingStepId(null);
        if (blob.size > 0) {
          setStepBlobs((prev) => {
            const next = new Map(prev);
            next.set(stepId, blob);
            return next;
          });
          resolve({ stepId, blob });
        } else {
          resolve(null);
        }
      };
      recorder.stop();
    });
  }, []);

  const startStepRecording = useCallback(
    async (stepId: MockCallRecordingKey) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMicDenied(true);
        return;
      }
      if (recordingStepId && recordingStepId !== stepId) {
        await stopActiveRecorder();
      }
      if (recorderRef.current?.state === "recording") {
        return;
      }
      try {
        const { micDeviceId } = getMockCallAudioDevicePrefs();
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: buildMockCallAudioInputConstraints(micDeviceId || undefined),
        });
        const mimeType = pickMimeType();
        const recorder = new MediaRecorder(stream, { mimeType });
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.start(1000);
        recorderRef.current = recorder;
        activeStepRef.current = stepId;
        setRecordingStepId(stepId);
        setMicDenied(false);
      } catch {
        setMicDenied(true);
        setRecordingStepId(null);
      }
    },
    [recordingStepId, stopActiveRecorder],
  );

  const stopStepRecording = useCallback(async () => {
    return stopActiveRecorder();
  }, [stopActiveRecorder]);

  const getStepBlob = useCallback(
    (stepId: MockCallRecordingKey) => stepBlobs.get(stepId),
    [stepBlobs],
  );

  const reset = useCallback(() => {
    void stopActiveRecorder();
    setStepBlobs(new Map());
    setRecordingStepId(null);
  }, [stopActiveRecorder]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      if (recorderRef.current?.stream) {
        for (const track of recorderRef.current.stream.getTracks()) {
          track.stop();
        }
      }
    };
  }, []);

  return {
    recordingStepId,
    stepBlobs,
    micDenied,
    setMicDenied,
    startStepRecording,
    stopStepRecording,
    getStepBlob,
    reset,
    isRecording: recordingStepId !== null,
  };
}
