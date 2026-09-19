import type { Hero, HeroLiveStats } from '../types/hero';
import type { PatchInfo } from './DataSource';
import { LocalDataSource } from './LocalDataSource';
import { RemoteDataSource } from './RemoteDataSource';
import { cacheGet, cacheGetStale, cacheSet } from './cache';
import type { DataSourceMode } from '../types/settings';

const LIVE_STATS_CACHE_KEY = 'data-repository:live-stats';
const DEFAULT_TTL_MIN = 60;

export interface DataStatus {
  mode: DataSourceMode;
  usingLiveStats: boolean;
  lastUpdated?: string;
  lastError?: string;
}

/**
 * Facade the rest of the app talks to for hero/stat data. Owns the
 * fallback chain so callers never have to think about it:
 *
 *   1. Try the configured remote source (if enabled) for live stats.
 *   2. On failure, fall back to the last valid cached snapshot.
 *   3. If there is no cache either, fall back to the bundled snapshot
 *      (which has no live stats — those fields are simply absent, and
 *      the UI/AI must say "Insufficient data" rather than invent them).
 *
 * Hero identity/kit metadata always comes from the bundled roster; only
 * win/pick/ban rates are ever "live".
 */
export class DataRepository {
  private local = new LocalDataSource();
  private remote = new RemoteDataSource();
  private status: DataStatus = { mode: 'bundled', usingLiveStats: false };

  getStatus(): DataStatus {
    return this.status;
  }

  async getHeroes(): Promise<Hero[]> {
    return this.local.getHeroes();
  }

  async getPatch(mode: DataSourceMode): Promise<PatchInfo> {
    if (mode === 'remote-opendota') {
      try {
        return await this.remote.getCurrentPatch();
      } catch {
        return this.local.getCurrentPatch();
      }
    }
    return this.local.getCurrentPatch();
  }

  /**
   * Fetch live stats honoring the configured mode, with graceful
   * degradation. `forceRefresh` bypasses the cache TTL (used by the
   * Settings "Update Data" button).
   */
  async getLiveStats(
    mode: DataSourceMode,
    patch: string,
    opts: { forceRefresh?: boolean; ttlMinutes?: number } = {}
  ): Promise<Map<string, HeroLiveStats>> {
    if (mode === 'bundled') {
      this.status = { mode, usingLiveStats: false };
      return new Map();
    }

    const ttl = opts.ttlMinutes ?? DEFAULT_TTL_MIN;

    if (!opts.forceRefresh) {
      const cached = await cacheGet<Record<string, HeroLiveStats>>(LIVE_STATS_CACHE_KEY);
      if (cached) {
        this.status = {
          mode,
          usingLiveStats: true,
          lastUpdated: Object.values(cached)[0]?.fetchedAt,
        };
        return new Map(Object.entries(cached));
      }
    }

    try {
      const live = await this.remote.getLiveStats(patch);
      const obj = Object.fromEntries(live);
      await cacheSet(LIVE_STATS_CACHE_KEY, obj, ttl);
      this.status = {
        mode,
        usingLiveStats: true,
        lastUpdated: new Date().toISOString(),
      };
      return live;
    } catch (err) {
      // Fall back to the last valid snapshot, however old, rather than
      // failing the whole app. If there is none, we run with no live
      // stats at all — callers must treat missing fields as "Insufficient
      // data", never guess.
      const stale = await cacheGetStale<Record<string, HeroLiveStats>>(LIVE_STATS_CACHE_KEY);
      this.status = {
        mode,
        usingLiveStats: !!stale,
        lastUpdated: stale ? Object.values(stale)[0]?.fetchedAt : undefined,
        lastError: err instanceof Error ? err.message : String(err),
      };
      return stale ? new Map(Object.entries(stale)) : new Map();
    }
  }
}

export const dataRepository = new DataRepository();
