"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deletePracticePatient,
  listPracticePatients,
  resetPracticeStore,
  savePracticePatient,
} from "@/lib/practice/db";
import { createEmptyPatient } from "@/lib/practice/seed";
import type { PracticePatient } from "@/lib/practice/types";
import { isPracticeDbSupported } from "@/lib/practice/wipe";

export function usePracticePatients(ownerUserId: string) {
  const [patients, setPatients] = useState<PracticePatient[]>([]);
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
      const rows = await listPracticePatients(ownerUserId);
      setPatients(rows);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load practice patients.",
      );
    } finally {
      setLoading(false);
    }
  }, [ownerUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const savePatient = useCallback(
    async (patient: PracticePatient) => {
      const saved = await savePracticePatient(ownerUserId, patient);
      await refresh();
      return saved;
    },
    [ownerUserId, refresh],
  );

  const removePatient = useCallback(
    async (patientId: string) => {
      await deletePracticePatient(ownerUserId, patientId);
      await refresh();
    },
    [ownerUserId, refresh],
  );

  const createPatient = useCallback(() => createEmptyPatient(), []);

  const resetAll = useCallback(async () => {
    await resetPracticeStore(ownerUserId);
    await refresh();
  }, [ownerUserId, refresh]);

  return {
    patients,
    loading,
    error,
    refresh,
    savePatient,
    removePatient,
    createPatient,
    resetAll,
  };
}
