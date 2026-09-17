"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteMockCallSession,
  listMockCallAudioForSessionId,
  listMockCallSessions,
  saveMockCallAudio,
  saveMockCallSession,
} from "@/lib/practice/db";
import type { MockCallAudioRecord, MockCallSession } from "@/lib/practice/types";
import { isPracticeDbSupported } from "@/lib/practice/wipe";

export function useMockCallSessions(ownerUserId: string) {
  const [sessions, setSessions] = useState<MockCallSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ownerUserId) return;
    if (!isPracticeDbSupported()) {
      setError("Practice Lab needs a browser with IndexedDB support.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await listMockCallSessions(ownerUserId);
      setSessions(rows);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load mock call sessions.",
      );
    } finally {
      setLoading(false);
    }
  }, [ownerUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const persistSession = useCallback(
    async (session: MockCallSession) => {
      const saved = await saveMockCallSession(ownerUserId, session);
      await refresh();
      return saved;
    },
    [ownerUserId, refresh],
  );

  const persistAudio = useCallback(
    async (record: MockCallAudioRecord) => {
      const saved = await saveMockCallAudio(ownerUserId, record);
      return saved;
    },
    [ownerUserId],
  );

  const removeSession = useCallback(
    async (sessionId: string) => {
      await deleteMockCallSession(ownerUserId, sessionId);
      await refresh();
    },
    [ownerUserId, refresh],
  );

  const loadSessionAudio = useCallback(
    async (sessionId: string) => {
      return listMockCallAudioForSessionId(ownerUserId, sessionId);
    },
    [ownerUserId],
  );

  return {
    sessions,
    loading,
    error,
    refresh,
    persistSession,
    persistAudio,
    removeSession,
    loadSessionAudio,
  };
}
