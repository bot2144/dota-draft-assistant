import { mapNpcNameToHeroId } from './heroNpcMap';

export interface ParsedGsiDraft {
  radiantPicks: string[];
  direPicks: string[];
  radiantBans: string[];
  direBans: string[];
  /** The local player's side, if GSI reports it this payload. */
  mySide: 'radiant' | 'dire' | null;
  /** Raw npc names present in the payload we could not map to a hero slug. */
  unmapped: string[];
}

function extractTeamPicksAndBans(
  team: Record<string, unknown> | undefined,
  allSlugs: string[],
  unmapped: string[]
): { picks: string[]; bans: string[] } {
  const picks: string[] = [];
  const bans: string[] = [];
  if (!team) return { picks, bans };

  for (const [key, value] of Object.entries(team)) {
    if (typeof value !== 'string') continue;
    const pickMatch = /^pick\d+_class$/.test(key);
    const banMatch = /^ban\d+_class$/.test(key);
    if (!pickMatch && !banMatch) continue;

    const slug = mapNpcNameToHeroId(value, allSlugs);
    if (!slug) {
      unmapped.push(value);
      continue;
    }
    if (pickMatch) picks.push(slug);
    else bans.push(slug);
  }
  return { picks, bans };
}

/**
 * Pure, testable extraction of draft state from a raw Dota 2 GSI payload.
 * Returns empty arrays when the payload has no draft section (e.g. outside
 * Captains Mode draft, or before the game hooks up) rather than throwing —
 * GSI payloads vary a lot in which sections are populated at any moment.
 */
export function parseDraftFromGsiPayload(payload: unknown, allSlugs: string[]): ParsedGsiDraft {
  const unmapped: string[] = [];
  const empty: ParsedGsiDraft = {
    radiantPicks: [],
    direPicks: [],
    radiantBans: [],
    direBans: [],
    mySide: null,
    unmapped,
  };

  if (typeof payload !== 'object' || payload === null) return empty;
  const p = payload as Record<string, unknown>;

  const draft = p.draft as Record<string, unknown> | undefined;
  if (!draft) return empty;

  // GSI convention: team2 = Radiant (DOTA_TEAM_GOODGUYS), team3 = Dire (DOTA_TEAM_BADGUYS).
  const radiant = extractTeamPicksAndBans(draft.team2 as Record<string, unknown>, allSlugs, unmapped);
  const dire = extractTeamPicksAndBans(draft.team3 as Record<string, unknown>, allSlugs, unmapped);

  let mySide: 'radiant' | 'dire' | null = null;
  const player = p.player as Record<string, unknown> | undefined;
  const teamName = player?.team_name;
  if (teamName === 'radiant' || teamName === 'dire') mySide = teamName;

  return {
    radiantPicks: radiant.picks,
    direPicks: dire.picks,
    radiantBans: radiant.bans,
    direBans: dire.bans,
    mySide,
    unmapped,
  };
}
