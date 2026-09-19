import { describe, it, expect } from 'vitest';
import { computeDraftScore } from '../DraftScore';
import { requireHero } from '../../data/heroes';

describe('computeDraftScore', () => {
  it('returns a neutral score for an empty team', () => {
    const result = computeDraftScore([], []);
    expect(result.score).toBe(50);
  });

  it('stays within 0-100 for a full 5-hero team', () => {
    const team = ['anti-mage', 'crystal-maiden', 'axe', 'lion', 'juggernaut'].map(requireHero);
    const result = computeDraftScore(team, []);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('penalizes a team with high-severity issues', () => {
    const team = ['anti-mage', 'drow-ranger', 'sniper', 'shadow-fiend', 'medusa'].map(requireHero); // all carries, no support
    const noIssues = computeDraftScore(team, []);
    const withIssues = computeDraftScore(team, [{ type: 'missing-role', severity: 'high', message: 'x' }]);
    expect(withIssues.score).toBeLessThan(noIssues.score);
  });

  it('tallies the power curve distribution correctly', () => {
    const team = ['axe', 'anti-mage'].map(requireHero); // axe=Early, anti-mage=Late
    const result = computeDraftScore(team, []);
    expect(result.powerCurve.early + result.powerCurve.mid + result.powerCurve.late + result.powerCurve.flexible).toBe(2);
  });
});
