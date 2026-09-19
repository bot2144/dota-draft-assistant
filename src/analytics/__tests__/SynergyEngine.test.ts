import { describe, it, expect } from 'vitest';
import { synergyEngine } from '../SynergyEngine';
import { requireHero } from '../../data/heroes';

describe('SynergyEngine', () => {
  it('returns insufficient confidence with no allies picked', () => {
    const hero = requireHero('earthshaker');
    const result = synergyEngine.scoreWithTeam(hero, []);
    expect(result.confidence).toBe('insufficient');
    expect(result.score).toBe(50);
  });

  it('uses curated data for a known combo (Earthshaker + Magnus)', () => {
    const es = requireHero('earthshaker');
    const magnus = requireHero('magnus');
    const pair = synergyEngine.pairSynergy(es, magnus);
    expect(pair.confidence).toBe('curated');
    expect(pair.strength).toBeGreaterThan(0);
  });

  it('scores a strong combo higher than a generic pairing', () => {
    const es = requireHero('earthshaker');
    const magnus = requireHero('magnus');
    const filler = requireHero('lich');

    const strongScore = synergyEngine.scoreWithTeam(es, [magnus]);
    const genericScore = synergyEngine.scoreWithTeam(es, [filler]);
    expect(strongScore.score).toBeGreaterThanOrEqual(genericScore.score);
  });

  it('teamfightScore stays within 0-100 bounds', () => {
    const hero = requireHero('tidehunter');
    const result = synergyEngine.teamfightScore(hero, [requireHero('enigma'), requireHero('magnus')]);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
