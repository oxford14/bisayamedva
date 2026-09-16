"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deletePracticeAppointment,
  listPracticeAppointments,
  savePracticeAppointment,
} from "@/lib/practice/db";
import { createEmptyAppointment } from "@/lib/practice/seed-appointments";
import type { PracticeAppointment } from "@/lib/practice/types";
import { isPracticeDbSupported } from "@/lib/practice/wipe";

export function usePracticeAppointments(ownerUserId: string) {
  const [appointments, setAppointments] = useState<PracticeAppointment[]>([]);
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
      const rows = await listPracticeAppointments(ownerUserId);
      setAppointments(rows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load practice appointments.",
      );
    } finally {
      setLoading(false);
    }
  }, [ownerUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveAppointment = useCallback(
    async (appointment: PracticeAppointment) => {
      const saved = await savePracticeAppointment(ownerUserId, appointment);
      await refresh();
      return saved;
    },
    [ownerUserId, refresh],
  );

  const removeAppointment = useCallback(
    async (appointmentId: string) => {
      await deletePracticeAppointment(ownerUserId, appointmentId);
      await refresh();
    },
    [ownerUserId, refresh],
  );

  const createAppointment = useCallback(
    (patientId?: string) => createEmptyAppointment(patientId ?? ""),
    [],
  );

  return {
    appointments,
    loading,
    error,
    refresh,
    saveAppointment,
    removeAppointment,
    createAppointment,
  };
}
