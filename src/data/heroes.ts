import type { Hero } from '../types/hero';
import { deriveDefaultCapability } from './heroDefaults';
import { HERO_ROSTER } from './heroRoster';

export const ALL_HEROES: Hero[] = HERO_ROSTER.map((raw) => {
  const capability =
    raw.capability ??
    deriveDefaultCapability({
      attribute: raw.attribute,
      attackType: raw.attackType,
      roles: raw.roles,
      damageType: raw.damageType,
      scaling: raw.scaling,
    });

  return {
    id: raw.id,
    localizedName: raw.localizedName,
    attribute: raw.attribute,
    attackType: raw.attackType,
    damageType: raw.damageType,
    roles: raw.roles,
    positions: raw.positions,
    complexity: raw.complexity,
    scaling: raw.scaling,
    tags: raw.tags ?? [],
    capability,
    confidence: raw.capability ? 'curated' : 'estimated',
    notes: raw.notes,
  } satisfies Hero;
});

const HERO_BY_ID = new Map(ALL_HEROES.map((h) => [h.id, h]));

export function getHero(id: string): Hero | undefined {
  return HERO_BY_ID.get(id);
}

export function requireHero(id: string): Hero {
  const h = HERO_BY_ID.get(id);
  if (!h) throw new Error(`Unknown hero id: ${id}`);
  return h;
}

export function searchHeroes(query: string): Hero[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_HEROES;
  return ALL_HEROES.filter(
    (h) =>
      h.localizedName.toLowerCase().includes(q) ||
      h.id.includes(q.replace(/\s+/g, '-'))
  );
}

export const HERO_COUNT = ALL_HEROES.length;
