import { describe, it, expect } from 'vitest';
import { winConditionEngine } from '../WinConditionEngine';
import { requireHero } from '../../data/heroes';

describe('WinConditionEngine', () => {
  it('returns undefined for an empty team', () => {
    expect(winConditionEngine.evaluate([])).toBeUndefined();
  });

  it('marks a single-hero team as insufficient confidence', () => {
    const result = winConditionEngine.evaluate([requireHero('anti-mage')]);
    expect(result?.confidence).toBe('insufficient');
  });

  it('derives an estimated win condition for a full-ish team without asserting certainty', () => {
    const team = ['anti-mage', 'phantom-assassin', 'terrorblade'].map(requireHero);
    const result = winConditionEngine.evaluate(team);
    expect(result?.confidence).toBe('estimated');
    expect(result?.dominantPhase).toBe('late');
    expect(result?.strength).toBeGreaterThan(0);
    expect(result?.strength).toBeLessThanOrEqual(100);
  });
});
