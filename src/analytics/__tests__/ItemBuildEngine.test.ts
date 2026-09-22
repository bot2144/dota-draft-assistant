import { describe, it, expect } from 'vitest';
import { itemBuildEngine } from '../ItemBuildEngine';
import { requireHero } from '../../data/heroes';

describe('ItemBuildEngine', () => {
  it('returns the curated base build unchanged when there is no enemy draft yet', () => {
    const am = requireHero('anti-mage');
    const build = itemBuildEngine.buildFor(am, []);
    expect(build.confidence).toBe('curated');
    expect(build.items.length).toBeGreaterThan(0);
    expect(build.items.some((i) => i.name.includes('Battle Fury'))).toBe(true);
  });

  it('falls back to an estimated archetype build for a hero without curated data', () => {
    const treant = requireHero('treant-protector');
    const build = itemBuildEngine.buildFor(treant, []);
    expect(build.confidence).toBe('estimated');
    expect(build.items.length).toBeGreaterThan(0);
  });

  it('adds a Black King Bar recommendation against a heavy-control enemy draft', () => {
    const am = requireHero('anti-mage');
    const enemyTeam = [requireHero('earthshaker'), requireHero('tidehunter')];
    const build = itemBuildEngine.buildFor(am, enemyTeam);
    const bkb = build.items.find((i) => i.name.includes('Black King Bar'));
    expect(bkb).toBeDefined();
    expect(bkb!.reason).toMatch(/Earthshaker|Tidehunter/);
  });

  it('adds a detection recommendation against an invisible enemy hero', () => {
    const pa = requireHero('phantom-assassin'); // already has BKB in curated build
    const enemyTeam = [requireHero('bounty-hunter')];
    const build = itemBuildEngine.buildFor(pa, enemyTeam);
    const detection = build.items.find((i) => /Sentry|Gem/.test(i.name));
    expect(detection).toBeDefined();
  });

  it('never duplicates an item that already exists in the base build', () => {
    const pa = requireHero('phantom-assassin'); // curated build already includes Black King Bar
    const enemyTeam = [requireHero('earthshaker'), requireHero('tidehunter')];
    const build = itemBuildEngine.buildFor(pa, enemyTeam);
    const bkbCount = build.items.filter((i) => i.name.includes('Black King Bar')).length;
    expect(bkbCount).toBe(1);
  });
});
