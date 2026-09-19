import type { Hero, HeroLiveStats } from '../types/hero';

export interface PatchInfo {
  id: string; // e.g. "7.39"
  label: string; // human readable, e.g. "Patch 7.39"
  releasedAt?: string;
}

/**
 * Abstraction over "where hero/stat data comes from". The rest of the app
 * (analytics engine, UI) only ever talks to a DataSource, never to a
 * specific API. This lets the data source be swapped (bundled snapshot,
 * OpenDota, Stratz, a future first-party backend, ...) without touching
 * any consuming code.
 */
export interface DataSource {
  readonly id: string;
  /** Static/bundled data — always available, never throws. */
  getHeroes(): Promise<Hero[]>;
  /** Current patch as understood by this source. */
  getCurrentPatch(): Promise<PatchInfo>;
  /**
   * Live statistics (win/pick/ban rate) for the given patch, if available.
   * Returns an empty map (not fabricated values) when unavailable.
   */
  getLiveStats(patch: string): Promise<Map<string, HeroLiveStats>>;
  /** Whether this source requires network access. */
  readonly requiresNetwork: boolean;
}
