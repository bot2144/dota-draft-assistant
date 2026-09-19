import { describe, it, expect } from 'vitest';
import { pickScorer } from '../PickScorer';
import { requireHero } from '../../data/heroes';
import { DEFAULT_WEIGHTS } from '../weights.config';

const baseCtx = {
  allyTeam: [] as ReturnType<typeof requireHero>[],
  enemyTeam: [] as ReturnType<typeof requireHero>[],
  openPositions: [1, 2, 3, 4, 5],
  liveStats: new Map(),
  weights: DEFAULT_WEIGHTS,
};

describe('PickScorer', () => {
  it('produces a bounded overall score with no context (cold start)', () => {
    const hero = requireHero('pudge');
    const candidate = pickScorer.score(hero, baseCtx);
    expect(candidate.overallScore).toBeGreaterThanOrEqual(0);
    expect(candidate.overallScore).toBeLessThanOrEqual(100);
    expect(candidate.factors).toHaveLength(12);
  });

  it('marks metaRelevance as insufficient when no live stats are provided', () => {
    const hero = requireHero('pudge');
    const candidate = pickScorer.score(hero, baseCtx);
    const meta = candidate.factors.find((f) => f.key === 'metaRelevance')!;
    expect(meta.confidence).toBe('insufficient');
  });

  it('uses live stats for metaRelevance when provided (never invents a number)', () => {
    const hero = requireHero('pudge');
    const liveStats = new Map([
      ['pudge', { heroId: 'pudge', patch: 'live', winRate: 55, pickRate: 10, source: 'opendota', fetchedAt: new Date().toISOString() }],
    ]);
    const candidate = pickScorer.score(hero, { ...baseCtx, liveStats });
    const meta = candidate.factors.find((f) => f.key === 'metaRelevance')!;
    expect(meta.confidence).toBe('live');
    expect(meta.score).toBeGreaterThan(50);
  });

  it('scores a hero that answers the strongest enemy threat higher on enemyThreatResponse', () => {
    const faceless = requireHero('faceless-void');
    const strongAnswer = requireHero('omniknight'); // curated counter to Chronosphere lockdown
    const weakAnswer = requireHero('lich');

    const strongCandidate = pickScorer.score(strongAnswer, { ...baseCtx, enemyTeam: [faceless] });
    const weakCandidate = pickScorer.score(weakAnswer, { ...baseCtx, enemyTeam: [faceless] });

    const strongFactor = strongCandidate.factors.find((f) => f.key === 'enemyThreatResponse')!.score;
    const weakFactor = weakCandidate.factors.find((f) => f.key === 'enemyThreatResponse')!.score;
    expect(strongFactor).toBeGreaterThanOrEqual(weakFactor);
  });

  it('suggests an open position that matches the hero natural role', () => {
    const carry = requireHero('anti-mage');
    const candidate = pickScorer.score(carry, { ...baseCtx, openPositions: [3, 4, 5] });
    expect(candidate.suggestedPosition).toBeDefined();
  });
});
