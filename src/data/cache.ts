/**
 * Small persistent key/value cache abstraction.
 *
 * Uses the Tauri filesystem-backed Store plugin when running inside the
 * desktop shell, and falls back to localStorage in a plain browser/dev
 * context. Every read is guarded — a corrupted or missing cache entry is
 * treated as a miss, never a crash (see requirement: don't fail on a
 * corrupted cache).
 */

interface CacheEnvelope<T> {
  value: T;
  cachedAt: number; // epoch ms
  ttlMinutes: number;
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

let tauriStorePromise: Promise<import('@tauri-apps/plugin-store').Store> | null = null;

async function getTauriStore() {
  if (!tauriStorePromise) {
    tauriStorePromise = import('@tauri-apps/plugin-store').then(({ Store }) =>
      Store.load('draft-assistant-cache.json')
    );
  }
  return tauriStorePromise;
}

export async function cacheGet<T>(key: string): Promise<T | undefined> {
  try {
    let raw: string | undefined;
    if (isTauri()) {
      const store = await getTauriStore();
      raw = await store.get<string>(key);
    } else {
      raw = localStorage.getItem(key) ?? undefined;
    }
    if (!raw) return undefined;
    const envelope = JSON.parse(raw) as CacheEnvelope<T>;
    const ageMinutes = (Date.now() - envelope.cachedAt) / 60000;
    if (ageMinutes > envelope.ttlMinutes) return undefined; // stale, but not deleted
    return envelope.value;
  } catch {
    // Corrupted cache entry — treat as a miss rather than throwing.
    return undefined;
  }
}

/** Returns the cached value even if stale (for offline fallback), or undefined if absent/corrupt. */
export async function cacheGetStale<T>(key: string): Promise<T | undefined> {
  try {
    let raw: string | undefined;
    if (isTauri()) {
      const store = await getTauriStore();
      raw = await store.get<string>(key);
    } else {
      raw = localStorage.getItem(key) ?? undefined;
    }
    if (!raw) return undefined;
    const envelope = JSON.parse(raw) as CacheEnvelope<T>;
    return envelope.value;
  } catch {
    return undefined;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlMinutes: number): Promise<void> {
  try {
    const envelope: CacheEnvelope<T> = { value, cachedAt: Date.now(), ttlMinutes };
    const raw = JSON.stringify(envelope);
    if (isTauri()) {
      const store = await getTauriStore();
      await store.set(key, raw);
      await store.save();
    } else {
      localStorage.setItem(key, raw);
    }
  } catch {
    // Best-effort cache; failures here must never break the app.
  }
}

export async function cacheClear(key: string): Promise<void> {
  try {
    if (isTauri()) {
      const store = await getTauriStore();
      await store.delete(key);
      await store.save();
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}
