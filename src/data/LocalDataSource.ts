import type { Hero, HeroLiveStats } from '../types/hero';
import { ALL_HEROES } from './heroes';
import type { DataSource, PatchInfo } from './DataSource';

/** The patch label the bundled/curated snapshot was authored against. */
export const BUNDLED_SNAPSHOT_PATCH: PatchInfo = {
  id: '7.39',
  label: 'Patch 7.39 (bundled snapshot)',
};

/**
 * Always-available local data source backed by the bundled, hand-curated
 * hero roster. Never throws and never requires network access, so the app
 * keeps working fully offline. Live stats are intentionally empty here —
 * this source never invents win/pick/ban rates.
 */
export class LocalDataSource implements DataSource {
  readonly id = 'bundled';
  readonly requiresNetwork = false;

  async getHeroes(): Promise<Hero[]> {
    return ALL_HEROES;
  }

  async getCurrentPatch(): Promise<PatchInfo> {
    return BUNDLED_SNAPSHOT_PATCH;
  }

  async getLiveStats(): Promise<Map<string, HeroLiveStats>> {
    return new Map();
  }
}
