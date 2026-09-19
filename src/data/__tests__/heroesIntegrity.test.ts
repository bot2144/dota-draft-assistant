import { describe, it, expect } from 'vitest';
import { ALL_HEROES, getHero, HERO_COUNT } from '../heroes';
import { CURATED_MATCHUPS } from '../curatedMatchups';
import { CURATED_SYNERGIES } from '../curatedSynergies';

describe('hero roster integrity', () => {
  it('has a substantial roster with unique ids', () => {
    expect(HERO_COUNT).toBeGreaterThan(100);
    const ids = new Set(ALL_HEROES.map((h) => h.id));
    expect(ids.size).toBe(ALL_HEROES.length);
  });

  it('every hero has a valid capability vector in range 0-3', () => {
    for (const h of ALL_HEROES) {
      for (const v of Object.values(h.capability)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(3);
      }
    }
  });

  it('every curated matchup references real heroes', () => {
    for (const m of CURATED_MATCHUPS) {
      expect(getHero(m.heroId), `unknown hero id ${m.heroId}`).toBeDefined();
      expect(getHero(m.vsHeroId), `unknown hero id ${m.vsHeroId}`).toBeDefined();
    }
  });

  it('every curated synergy references real heroes', () => {
    for (const s of CURATED_SYNERGIES) {
      expect(getHero(s.heroA), `unknown hero id ${s.heroA}`).toBeDefined();
      expect(getHero(s.heroB), `unknown hero id ${s.heroB}`).toBeDefined();
    }
  });

  it('getHero returns undefined for an invalid id (no throw)', () => {
    expect(getHero('not-a-real-hero')).toBeUndefined();
  });
});
