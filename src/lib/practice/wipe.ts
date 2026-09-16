import {
  PRACTICE_DB_NAME,
  PRACTICE_DB_VERSION,
} from "@/lib/practice/constants";

export function deletePracticeDb(): Promise<void> {
  if (typeof indexedDB === "undefined") {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(PRACTICE_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("IDB delete failed"));
    request.onblocked = () => {
      // Another tab may hold the DB open; still resolve so logout can continue.
      resolve();
    };
  });
}

export function isPracticeDbSupported() {
  return typeof indexedDB !== "undefined";
}

export { PRACTICE_DB_NAME, PRACTICE_DB_VERSION };
