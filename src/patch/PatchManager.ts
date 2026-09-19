import type { PatchInfo } from '../data/DataSource';
import { BUNDLED_SNAPSHOT_PATCH } from '../data/LocalDataSource';
import { cacheGet, cacheSet } from '../data/cache';

const PATCH_CACHE_KEY = 'patch-manager:current-patch';
const PATCH_CACHE_TTL_MIN = 60 * 12; // half a day

/**
 * Tracks "what patch are we reasoning about" and ensures statistics from
 * different patches are never silently mixed. All analytics/AI output is
 * tagged with the active patch so the UI can show it and so cached data
 * from an old patch is never presented as current without a label.
 */
export class PatchManager {
  private current: PatchInfo = BUNDLED_SNAPSHOT_PATCH;
  private initialized = false;

  async init(): Promise<PatchInfo> {
    if (this.initialized) return this.current;
    const cached = await cacheGet<PatchInfo>(PATCH_CACHE_KEY);
    this.current = cached ?? BUNDLED_SNAPSHOT_PATCH;
    this.initialized = true;
    return this.current;
  }

  getCurrentPatch(): PatchInfo {
    return this.current;
  }

  async setPatch(patch: PatchInfo): Promise<void> {
    this.current = patch;
    await cacheSet(PATCH_CACHE_KEY, patch, PATCH_CACHE_TTL_MIN);
  }

  /** Convenience for consumers that only need the fallback bundled patch. */
  static bundled(): PatchInfo {
    return BUNDLED_SNAPSHOT_PATCH;
  }
}

export const patchManager = new PatchManager();
