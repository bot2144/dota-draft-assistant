import { describe, it, expect, beforeEach } from 'vitest';
import { AIService } from '../AIService';
import { requireHero } from '../../data/heroes';
import { pickScorer } from '../../analytics/PickScorer';
import { DEFAULT_WEIGHTS } from '../../analytics/weights.config';

const ctx = { allyTeam: [], enemyTeam: [], openPositions: [1, 2, 3, 4, 5], liveStats: new Map(), weights: DEFAULT_WEIGHTS };

describe('AIService — graceful degradation when AI is unavailable', () => {
  let service: AIService;

  beforeEach(() => {
    service = new AIService();
    // No configure() call — provider stays "none".
  });

  it('reports itself as unavailable with no provider configured', () => {
    expect(service.isAvailable()).toBe(false);
  });

  it('explainPick falls back to a local, data-grounded explanation instead of throwing', async () => {
    const hero = requireHero('pudge');
    const candidate = pickScorer.score(hero, ctx);
    const result = await service.explainPick(hero, candidate, [], [], 'en');
    expect(result.usedAI).toBe(false);
    expect(result.errorKind).toBe('no-api-key');
    expect(result.text).toContain('Pudge');
  });

  it('whatShouldIPick falls back gracefully with a ranked list from the local engine', async () => {
    const hero = requireHero('pudge');
    const candidate = pickScorer.score(hero, ctx);
    const result = await service.whatShouldIPick([], [], [{ hero, candidate }], {
      allyIssues: [],
      enemyThreats: [],
      recommendedBans: [],
      bestPicks: [candidate],
      patch: '7.39',
      generatedAt: new Date().toISOString(),
    }, 'en');
    expect(result.usedAI).toBe(false);
    expect(result.text).toContain('Pudge');
  });

  it('answerQuestion never throws even with a configured-but-unreachable provider', async () => {
    // Point at a local port nothing is listening on so this fails fast
    // (connection refused) instead of depending on real network access.
    service.configure({ provider: 'compatible', baseUrl: 'http://127.0.0.1:9' });
    const result = await service.answerQuestion([], [], {
      allyIssues: [],
      enemyThreats: [],
      recommendedBans: [],
      bestPicks: [],
      patch: '7.39',
      generatedAt: new Date().toISOString(),
    }, 'What should I do?', 'en');
    expect(result.usedAI).toBe(false);
    expect(result.text.length).toBeGreaterThan(0);
  }, 15000);
});
