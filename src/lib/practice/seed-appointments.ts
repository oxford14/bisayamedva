import { startOfWeek } from "@/lib/practice/scheduling-calendar";
import type { PracticeAppointment, PracticePatient } from "@/lib/practice/types";

function nowIso() {
  return new Date().toISOString();
}

function slotInWeek(
  weekStart: Date,
  dayOffset: number,
  hour: number,
  minute: number,
): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function createSeedAppointments(
  patients: PracticePatient[],
): PracticeAppointment[] {
  const registered = patients.filter((p) => p.status === "registered");
  if (registered.length === 0) return [];

  const maria =
    registered.find((p) => p.legalLastName === "Santos") ?? registered[0];
  const priya =
    registered.find((p) => p.legalLastName === "Patel") ?? registered[1];

  const weekStart = startOfWeek(new Date(), 0);
  const ts = nowIso();

  const rows: PracticeAppointment[] = [
    {
      id: crypto.randomUUID(),
      kind: "appointment",
      patientId: maria.id,
      providerName: "Dr. Elena Reyes, MD",
      visitType: "Follow-up",
      location: "Office",
      startsAt: slotInWeek(weekStart, 1, 8, 0),
      durationMinutes: 60,
      reasonForVisit: "Blood pressure follow-up — demo only.",
      status: "scheduled",
      notes: "Simulation — New status.",
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: crypto.randomUUID(),
      kind: "appointment",
      patientId: priya?.id ?? maria.id,
      providerName: "Jordan Walsh, NP",
      visitType: "New patient",
      location: "Telehealth",
      startsAt: slotInWeek(weekStart, 1, 9, 30),
      durationMinutes: 45,
      reasonForVisit: "Establish care — intake review.",
      status: "checked_in",
      notes: "Simulation — Requested status.",
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: crypto.randomUUID(),
      kind: "block",
      patientId: "",
      providerName: "Dr. Elena Reyes, MD",
      visitType: "",
      location: "Office",
      startsAt: slotInWeek(weekStart, 2, 11, 15),
      durationMinutes: 30,
      reasonForVisit: "Send thank you note to DocMeIn",
      status: "scheduled",
      notes: "Time block — not a patient visit.",
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: crypto.randomUUID(),
      kind: "appointment",
      patientId: maria.id,
      providerName: "Dr. Michael Chen, MD",
      visitType: "Annual wellness",
      location: "Office",
      startsAt: slotInWeek(weekStart, 3, 10, 0),
      durationMinutes: 60,
      reasonForVisit: "Annual wellness — confirmed demo.",
      status: "completed",
      notes: "",
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  if (priya) {
    rows.push({
      id: crypto.randomUUID(),
      kind: "appointment",
      patientId: priya.id,
      providerName: "Dr. Amara Okonkwo, MD",
      visitType: "Sick visit",
      location: "Office",
      startsAt: slotInWeek(weekStart, 4, 14, 0),
      durationMinutes: 30,
      reasonForVisit: "Cold symptoms — demo.",
      status: "scheduled",
      notes: "",
      createdAt: ts,
      updatedAt: ts,
    });
  }

  return rows;
}

export function createEmptyAppointment(patientId = ""): PracticeAppointment {
  const ts = nowIso();
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);

  return {
    id: crypto.randomUUID(),
    kind: "appointment",
    patientId,
    providerName: "",
    visitType: "",
    location: "Office",
    startsAt: start.toISOString(),
    durationMinutes: 30,
    reasonForVisit: "",
    status: "scheduled",
    notes: "",
    createdAt: ts,
    updatedAt: ts,
  };
}

export function createEmptyBlock(): PracticeAppointment {
  const base = createEmptyAppointment("");
  return {
    ...base,
    kind: "block",
    patientId: "",
    visitType: "",
    reasonForVisit: "",
    durationMinutes: 30,
  };
}
