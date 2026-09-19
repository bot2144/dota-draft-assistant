import { describe, it, expect } from 'vitest';
import { counterEngine } from '../CounterEngine';
import { requireHero } from '../../data/heroes';

describe('CounterEngine', () => {
  it('returns a neutral, insufficient-confidence score against an empty enemy team', () => {
    const am = requireHero('anti-mage');
    const result = counterEngine.scoreAgainstTeam(am, []);
    expect(result.score).toBe(50);
    expect(result.confidence).toBe('insufficient');
  });

  it('uses curated data for a known hard-counter pair (Silencer vs Witch Doctor)', () => {
    const silencer = requireHero('silencer');
    const witchDoctor = requireHero('witch-doctor');
    const matchup = counterEngine.matchup(silencer, witchDoctor);
    expect(matchup.confidence).toBe('curated');
    expect(matchup.advantage).toBeGreaterThan(0);
  });

  it('falls back to the heuristic engine for an uncurated pair', () => {
    const dragonKnight = requireHero('dragon-knight');
    const treant = requireHero('treant-protector');
    const matchup = counterEngine.matchup(dragonKnight, treant);
    expect(matchup.confidence).toBe('estimated');
    expect(matchup.advantage).toBeGreaterThanOrEqual(-3);
    expect(matchup.advantage).toBeLessThanOrEqual(3);
  });

  it('scores hard control positively against a mobility-reliant, low-tank hero', () => {
    const mars = requireHero('mars');
    const drow = requireHero('drow-ranger');
    const result = counterEngine.scoreAgainstTeam(mars, [drow]);
    expect(result.score).toBeGreaterThan(50);
  });

  it('threatAgainstTeam mirrors matchup direction from the enemy perspective', () => {
    const crystalMaiden = requireHero('crystal-maiden');
    const faceless = requireHero('faceless-void');
    const threat = counterEngine.threatAgainstTeam(faceless, [crystalMaiden]);
    expect(threat.threatLevel).toBeGreaterThan(50);
  });
});
