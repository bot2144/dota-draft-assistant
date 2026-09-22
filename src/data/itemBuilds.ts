import type { Hero } from '../types/hero';
import type { HeroItemBuild, ItemRecommendation } from '../types/itemBuild';
import { CURATED_ITEM_BUILDS } from './curatedItemBuilds';

const CURATED_BY_ID = new Map(CURATED_ITEM_BUILDS.map((b) => [b.heroId, b]));

/**
 * Generic archetype-based fallback item path for heroes without a
 * hand-curated build. Mirrors the "derive from attribute/role/attack-type"
 * approach used in heroDefaults.ts's capability fallback, and is always
 * tagged 'estimated' so the UI never presents a guess as a specific,
 * researched build.
 */
function deriveArchetypeBuild(hero: Hero): ItemRecommendation[] {
  const has = (r: string) => hero.roles.includes(r as never);
  const items: ItemRecommendation[] = [];

  // Starting items
  if (has('Support')) {
    items.push({ name: 'Tango + Clarity + wards', category: 'starting', reason: 'Standard support sustain and vision kit.' });
  } else {
    items.push({ name: 'Quelling Blade / Branches', category: 'starting', reason: 'Standard laning sustain and last-hit help for a core.' });
  }

  // Early item
  if (hero.attribute === 'STR' && has('Carry')) {
    items.push({ name: 'Stout Shield + Branches', category: 'early', reason: 'Cheap survivability while farming through the laning phase.' });
  } else if (hero.attribute === 'INT') {
    items.push({ name: 'Null Talisman', category: 'early', reason: 'Cheap mana sustain and stats for a spell-reliant hero.' });
  } else {
    items.push({ name: 'Wraith Band', category: 'early', reason: 'Cheap all-around stats to reinforce the early game.' });
  }

  // Core item(s) by role
  if (has('Carry')) {
    items.push({ name: hero.attackType === 'Melee' ? 'Battle Fury' : 'Dragon Lance', category: 'core', reason: 'Standard farming/scaling item for this archetype of carry.' });
  }
  if (has('Initiator') || has('Disabler')) {
    items.push({ name: 'Blink Dagger', category: 'core', reason: 'Reliable initiation range to land the hero\'s key disable.' });
  }
  if (has('Support')) {
    items.push({ name: 'Glimmer Cape / Force Staff', category: 'core', reason: 'Standard support utility item to save an ally under focus.' });
  }
  if (has('Nuker') && !has('Support')) {
    items.push({ name: 'Kaya', category: 'core', reason: 'Spell amplification and mana sustain for a nuke-reliant kit.' });
  }
  if (items.filter((i) => i.category === 'core').length === 0) {
    items.push({ name: 'Aghanim\'s Scepter/Shard', category: 'core', reason: 'Generic power spike — check the hero\'s upgrade in-game for specifics.' });
  }

  // Situational
  if (has('Carry') || has('Nuker')) {
    items.push({ name: 'Black King Bar', category: 'situational', reason: 'Standard answer to enemy disables when this hero has no innate escape.' });
  }
  items.push({ name: 'Aghanim\'s Scepter/Shard', category: 'luxury', reason: 'Generic late-game power spike — verify the specific upgrade for this hero in-game.' });

  return items;
}

/** Get an item build for a hero — curated if available, otherwise a clearly-marked estimated fallback. */
export function getItemBuild(hero: Hero): HeroItemBuild {
  const curated = CURATED_BY_ID.get(hero.id);
  if (curated) return curated;
  return {
    heroId: hero.id,
    confidence: 'estimated',
    items: deriveArchetypeBuild(hero),
  };
}
