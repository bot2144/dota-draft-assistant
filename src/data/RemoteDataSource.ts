import type { Hero, HeroLiveStats } from '../types/hero';
import { ALL_HEROES } from './heroes';
import type { DataSource, PatchInfo } from './DataSource';

const OPENDOTA_HERO_STATS_URL = 'https://api.opendota.com/api/heroStats';
const FETCH_TIMEOUT_MS = 8000;

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const NAME_INDEX = new Map(ALL_HEROES.map((h) => [normalize(h.localizedName), h.id]));

interface OpenDotaHeroStatRecord {
  localized_name: string;
  pro_pick?: number;
  pro_win?: number;
  pro_ban?: number;
  '8_pick'?: number;
  '8_win'?: number;
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Remote data source that enriches the bundled roster with live public
 * win/pick rate (Immortal bracket) and pro ban rate figures from OpenDota's
 * public, keyless `/heroStats` endpoint.
 *
 * All percentages are *derived* from the raw counts OpenDota returns (never
 * invented): pick/ban rate are each hero's share of total games inferred by
 * summing picks across the whole roster (10 picks per game). If the request
 * fails for any reason (no network, CORS, timeout, schema change), this
 * source throws and the caller (DataRepository) falls back to the last
 * valid cached snapshot or the bundled data — the app keeps working.
 */
export class RemoteDataSource implements DataSource {
  readonly id = 'opendota';
  readonly requiresNetwork = true;

  async getHeroes(): Promise<Hero[]> {
    // Hero identity/kit metadata stays bundled; only stats come live.
    return ALL_HEROES;
  }

  async getCurrentPatch(): Promise<PatchInfo> {
    // OpenDota's constants/patch endpoint changes shape often; we treat the
    // bundled patch label as authoritative for kit data and only use this
    // source for live stats, tagged with their own patch-agnostic caveat.
    return { id: 'live', label: 'Live (OpenDota public stats)' };
  }

  async getLiveStats(patch: string): Promise<Map<string, HeroLiveStats>> {
    const res = await fetchWithTimeout(OPENDOTA_HERO_STATS_URL, FETCH_TIMEOUT_MS);
    const rows = (await res.json()) as OpenDotaHeroStatRecord[];
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('Unexpected OpenDota response shape');
    }

    const totalPubGames = rows.reduce((sum, r) => sum + (r['8_pick'] ?? 0), 0) / 10;
    const totalProGames = rows.reduce((sum, r) => sum + (r.pro_pick ?? 0), 0) / 10;

    const out = new Map<string, HeroLiveStats>();
    const fetchedAt = new Date().toISOString();

    for (const row of rows) {
      const heroId = NAME_INDEX.get(normalize(row.localized_name ?? ''));
      if (!heroId) continue; // unmapped hero (e.g. brand-new) — skip rather than guess

      const picks = row['8_pick'] ?? 0;
      const wins = row['8_win'] ?? 0;
      const proBan = row.pro_ban ?? 0;

      const stats: HeroLiveStats = {
        heroId,
        patch,
        source: 'opendota',
        fetchedAt,
        sampleSize: picks,
      };
      if (picks > 0) stats.winRate = (wins / picks) * 100;
      if (totalPubGames > 0) stats.pickRate = (picks / totalPubGames) * 100;
      if (totalProGames > 0) stats.banRate = (proBan / totalProGames) * 100;

      out.set(heroId, stats);
    }

    return out;
  }
}
