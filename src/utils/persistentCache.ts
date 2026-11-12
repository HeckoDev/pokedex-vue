// Persistent (IndexedDB) key/value cache with TTL. Every operation degrades to a no-op when
// IndexedDB is unavailable (SSR, tests, private mode) so callers never have to handle failures.

const DB_NAME = "pokedex-cache";
const STORE = "responses";
const DB_VERSION = 1;

export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  dbPromise ??= new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve) => {
        if (!db) return resolve(undefined);
        try {
          const request = operation(db.transaction(STORE, mode).objectStore(STORE));
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(undefined);
        } catch {
          resolve(undefined);
        }
      })
  );
}

export async function getPersisted<T>(key: string): Promise<T | undefined> {
  const entry = await run<CacheEntry | undefined>("readonly", (store) => store.get(key));
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    void run("readwrite", (store) => store.delete(key));
    return undefined;
  }
  return entry.value as T;
}

export async function setPersisted(key: string, value: unknown, ttlMs = CACHE_TTL_MS): Promise<void> {
  const entry: CacheEntry = { value, expiresAt: Date.now() + ttlMs };
  await run("readwrite", (store) => store.put(entry, key));
}

export async function clearPersisted(): Promise<void> {
  await run("readwrite", (store) => store.clear());
}
