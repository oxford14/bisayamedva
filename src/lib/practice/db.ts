import {
  PRACTICE_DB_NAME,
  PRACTICE_DB_VERSION,
  PRACTICE_SCHEMA_VERSION,
} from "@/lib/practice/constants";
import { normalizePracticeAppointment } from "@/lib/practice/appointment-normalize";
import { createSeedAppointments } from "@/lib/practice/seed-appointments";
import { createSeedPatients } from "@/lib/practice/seed";
import type {
  PracticeAppointment,
  PracticeMetaRecord,
  PracticePatient,
} from "@/lib/practice/types";

const META_KEY = "owner" as const;

function openPracticeDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PRACTICE_DB_NAME, PRACTICE_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("patients")) {
        const store = db.createObjectStore("patients", { keyPath: "id" });
        store.createIndex("lastName", "legalLastName", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains("appointments")) {
        const store = db.createObjectStore("appointments", { keyPath: "id" });
        store.createIndex("patientId", "patientId", { unique: false });
        store.createIndex("startsAt", "startsAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open practice database."));
  });
}

function readMeta(db: IDBDatabase): Promise<PracticeMetaRecord | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("meta", "readonly");
    const req = tx.objectStore("meta").get(META_KEY);
    req.onsuccess = () => resolve(req.result as PracticeMetaRecord | undefined);
    req.onerror = () => reject(req.error);
  });
}

function writeMeta(db: IDBDatabase, ownerUserId: string): Promise<void> {
  const record: PracticeMetaRecord = {
    key: META_KEY,
    ownerUserId,
    schemaVersion: PRACTICE_SCHEMA_VERSION,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction("meta", "readwrite");
    tx.objectStore("meta").put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function clearPatients(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("patients", "readwrite");
    tx.objectStore("patients").clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function clearAppointments(db: IDBDatabase): Promise<void> {
  if (!db.objectStoreNames.contains("appointments")) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction("appointments", "readwrite");
    tx.objectStore("appointments").clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function putPatients(db: IDBDatabase, patients: PracticePatient[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("patients", "readwrite");
    const store = tx.objectStore("patients");
    for (const patient of patients) {
      store.put(patient);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function putAppointments(
  db: IDBDatabase,
  appointments: PracticeAppointment[],
): Promise<void> {
  if (!db.objectStoreNames.contains("appointments")) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction("appointments", "readwrite");
    const store = tx.objectStore("appointments");
    for (const row of appointments) {
      store.put(row);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function listAllPatients(db: IDBDatabase): Promise<PracticePatient[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("patients", "readonly");
    const req = tx.objectStore("patients").getAll();
    req.onsuccess = () => resolve((req.result as PracticePatient[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

function listAllAppointments(db: IDBDatabase): Promise<PracticeAppointment[]> {
  if (!db.objectStoreNames.contains("appointments")) {
    return Promise.resolve([]);
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction("appointments", "readonly");
    const req = tx.objectStore("appointments").getAll();
    req.onsuccess = () =>
      resolve(
        ((req.result as PracticeAppointment[]) ?? []).map(
          normalizePracticeAppointment,
        ),
      );
    req.onerror = () => reject(req.error);
  });
}

async function seedIfEmpty(db: IDBDatabase) {
  let patients = await listAllPatients(db);
  if (patients.length === 0) {
    patients = createSeedPatients();
    await putPatients(db, patients);
  }

  const appointments = await listAllAppointments(db);
  if (appointments.length === 0) {
    await putAppointments(db, createSeedAppointments(patients));
  }
}

/**
 * Opens practice DB, ensures owner matches, seeds demo patients when empty.
 */
export async function initPracticeStore(ownerUserId: string) {
  const db = await openPracticeDb();
  const meta = await readMeta(db);

  if (!meta || meta.ownerUserId !== ownerUserId) {
    await clearPatients(db);
    await clearAppointments(db);
    await writeMeta(db, ownerUserId);
    await seedIfEmpty(db);
  } else {
    await seedIfEmpty(db);
  }

  return db;
}

export async function listPracticePatients(
  ownerUserId: string,
): Promise<PracticePatient[]> {
  const db = await initPracticeStore(ownerUserId);
  const patients = await listAllPatients(db);
  return patients.sort((a, b) => {
    const last = a.legalLastName.localeCompare(b.legalLastName);
    if (last !== 0) return last;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export async function savePracticePatient(
  ownerUserId: string,
  patient: PracticePatient,
): Promise<PracticePatient> {
  await initPracticeStore(ownerUserId);
  const db = await openPracticeDb();
  const next: PracticePatient = {
    ...patient,
    updatedAt: new Date().toISOString(),
  };
  await putPatients(db, [next]);
  return next;
}

export async function deletePracticePatient(
  ownerUserId: string,
  patientId: string,
): Promise<void> {
  await initPracticeStore(ownerUserId);
  const db = await openPracticeDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("patients", "readwrite");
    tx.objectStore("patients").delete(patientId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  if (db.objectStoreNames.contains("appointments")) {
    const rows = await listAllAppointments(db);
    const toRemove = rows.filter((a) => a.patientId === patientId);
    if (toRemove.length > 0) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("appointments", "readwrite");
        const store = tx.objectStore("appointments");
        for (const row of toRemove) {
          store.delete(row.id);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  }
}

export async function listPracticeAppointments(
  ownerUserId: string,
): Promise<PracticeAppointment[]> {
  const db = await initPracticeStore(ownerUserId);
  const rows = await listAllAppointments(db);
  return rows.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function savePracticeAppointment(
  ownerUserId: string,
  appointment: PracticeAppointment,
): Promise<PracticeAppointment> {
  await initPracticeStore(ownerUserId);
  const db = await openPracticeDb();
  const next: PracticeAppointment = {
    ...appointment,
    updatedAt: new Date().toISOString(),
  };
  await putAppointments(db, [next]);
  return next;
}

export async function deletePracticeAppointment(
  ownerUserId: string,
  appointmentId: string,
): Promise<void> {
  await initPracticeStore(ownerUserId);
  const db = await openPracticeDb();
  if (!db.objectStoreNames.contains("appointments")) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction("appointments", "readwrite");
    tx.objectStore("appointments").delete(appointmentId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function resetPracticeStore(ownerUserId: string): Promise<void> {
  const db = await openPracticeDb();
  await clearPatients(db);
  await clearAppointments(db);
  await writeMeta(db, ownerUserId);
  await seedIfEmpty(db);
}
