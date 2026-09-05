const DB_NAME = "mitz-siddur";
const STORE = "siddurim";
const SETTINGS_KEY = "mitz-siddur-settings";

export const DEFAULT_SETTINGS = {
  heSize: 1.28,
  enSize: 1.05,
  lineHeight: 1.7,
  paraGap: 0.85,
  heFont: "frank",
  enFont: "manrope",
};

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("aborted"));
  });
}

export async function listSiddurim() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const rows = (req.result || [])
        .map((row) => ({
          id: row.id,
          name: row.name,
          savedAt: row.savedAt,
          summary: row.summary || "",
        }))
        .sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getSiddur(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSiddur(record) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(record);
  await txDone(tx);
  return record;
}

export async function deleteSiddur(id) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
  await txDone(tx);
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `siddur-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function toFilePayload(record) {
  return {
    kind: "mitz-siddur",
    version: 1,
    id: record.id,
    name: record.name,
    savedAt: record.savedAt,
    summary: record.summary,
    facts: record.facts,
    built: record.built,
  };
}

export function fromFilePayload(data) {
  if (!data || data.kind !== "mitz-siddur" || !data.facts || !data.built) {
    throw new Error("This file is not a MITZ siddur.");
  }
  return {
    id: data.id || newId(),
    name: data.name || "Untitled siddur",
    savedAt: data.savedAt || new Date().toISOString(),
    summary: data.summary || "",
    facts: data.facts,
    built: data.built,
  };
}

export function downloadJson(record) {
  const blob = new Blob([JSON.stringify(toFilePayload(record), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(record.name)}.siddur.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function slug(name) {
  return String(name || "siddur")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
