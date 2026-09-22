/**
 * Maps Dota 2's internal hero unit names (as sent by GSI, e.g.
 * "npc_dota_hero_antimage") to this app's own hero slugs (e.g. "anti-mage").
 *
 * Most hero slugs match Valve's internal name if you swap dashes for
 * underscores, but a meaningful minority don't (legacy names kept for
 * backwards compatibility in the game's own files). Those exceptions are
 * listed explicitly below; everything else uses the regular transform.
 *
 * If a real GSI payload contains a name this table doesn't resolve, we
 * never guess — the caller surfaces it as an "unmapped hero" so it can be
 * reported and added, rather than silently mis-filling the draft board.
 */

// slug -> Valve internal suffix (without the "npc_dota_hero_" prefix), only
// where it differs from the regular dash-to-underscore transform.
const SLUG_TO_NPC_EXCEPTIONS: Record<string, string> = {
  'anti-mage': 'antimage',
  'centaur-warrunner': 'centaur',
  clockwerk: 'rattletrap',
  doom: 'doom_bringer',
  lifestealer: 'life_stealer',
  magnus: 'magnataur',
  necrophos: 'necrolyte',
  'outworld-destroyer': 'obsidian_destroyer',
  'queen-of-pain': 'queenofpain',
  'shadow-fiend': 'nevermore',
  'treant-protector': 'treant',
  underlord: 'abyssal_underlord',
  'vengeful-spirit': 'vengefulspirit',
  'wraith-king': 'skeleton_king',
  zeus: 'zuus',
  io: 'wisp',
  timbersaw: 'shredder',
};

const NPC_TO_SLUG = new Map<string, string>();
for (const [slug, npcSuffix] of Object.entries(SLUG_TO_NPC_EXCEPTIONS)) {
  NPC_TO_SLUG.set(`npc_dota_hero_${npcSuffix}`, slug);
}

/** Builds the full reverse map once, given the roster's actual slug list (so it stays correct if the roster changes). */
export function buildNpcToSlugMap(allSlugs: string[]): Map<string, string> {
  const map = new Map(NPC_TO_SLUG);
  for (const slug of allSlugs) {
    const npcName = `npc_dota_hero_${slug.replace(/-/g, '_')}`;
    if (!map.has(npcName)) map.set(npcName, slug);
  }
  return map;
}

let cached: Map<string, string> | null = null;

/** Resolves a GSI hero unit name to this app's hero slug, or null if unrecognized. */
export function mapNpcNameToHeroId(npcName: string, allSlugs: string[]): string | null {
  if (!cached) cached = buildNpcToSlugMap(allSlugs);
  return cached.get(npcName) ?? null;
}
