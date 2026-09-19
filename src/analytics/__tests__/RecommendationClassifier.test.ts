import { describe, it, expect } from 'vitest';
import { classifyRecommendations, computePlayerFit } from '../RecommendationClassifier';
import { requireHero } from '../../data/heroes';
import type { PickCandidate } from '../../types/scoring';
import { DEFAULT_PLAYER_PROFILE } from '../../types/player';

function candidate(heroId: string, overallScore: number, risks: string[] = []): PickCandidate {
  return { heroId, overallScore, factors: [], strengths: [], risks, recommendationTypes: [] };
}

describe('RecommendationClassifier', () => {
  it('labels the top-scoring candidate as bestPick', () => {
    const heroesById = new Map([
      ['anti-mage', requireHero('anti-mage')],
      ['crystal-maiden', requireHero('crystal-maiden')],
    ]);
    const result = classifyRecommendations([candidate('anti-mage', 88), candidate('crystal-maiden', 60)], heroesById);
    expect(result.find((c) => c.heroId === 'anti-mage')?.recommendationTypes).toContain('bestPick');
  });

  it('labels close runners-up as alternatives', () => {
    const heroesById = new Map([
      ['anti-mage', requireHero('anti-mage')],
      ['crystal-maiden', requireHero('crystal-maiden')],
    ]);
    const result = classifyRecommendations([candidate('anti-mage', 88), candidate('crystal-maiden', 84)], heroesById);
    expect(result.find((c) => c.heroId === 'crystal-maiden')?.recommendationTypes).toContain('alternative');
  });

  it('never assigns comfortPick without an enabled player profile', () => {
    const heroesById = new Map([['anti-mage', requireHero('anti-mage')]]);
    const result = classifyRecommendations([candidate('anti-mage', 70)], heroesById, { ...DEFAULT_PLAYER_PROFILE, comfortHeroIds: ['anti-mage'], enabled: false });
    expect(result[0].recommendationTypes).not.toContain('comfortPick');
  });

  it('assigns comfortPick when enabled and the hero is in the comfort pool', () => {
    const heroesById = new Map([['anti-mage', requireHero('anti-mage')]]);
    const result = classifyRecommendations([candidate('anti-mage', 70)], heroesById, { ...DEFAULT_PLAYER_PROFILE, comfortHeroIds: ['anti-mage'], enabled: true });
    expect(result[0].recommendationTypes).toContain('comfortPick');
  });

  it('computePlayerFit returns 0 when the profile is disabled', () => {
    const hero = requireHero('anti-mage');
    const c = candidate('anti-mage', 70);
    expect(computePlayerFit(hero, c, { ...DEFAULT_PLAYER_PROFILE, enabled: false })).toBe(0);
  });

  it('computePlayerFit penalizes heroes on the avoid list', () => {
    const hero = requireHero('anti-mage');
    const c = candidate('anti-mage', 70);
    const fit = computePlayerFit(hero, c, { ...DEFAULT_PLAYER_PROFILE, enabled: true, avoidHeroIds: ['anti-mage'] });
    expect(fit).toBeLessThan(50);
  });
});
