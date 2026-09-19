import type { Hero, HeroLiveStats } from '../types/hero';
import type { BanCandidate } from '../types/scoring';
import { pickScorer } from './PickScorer';
import { DEFAULT_WEIGHTS } from './weights.config';

export interface BanContext {
  allyTeam: Hero[];
  enemyTeam: Hero[];
  liveStats: Map<string, HeroLiveStats>;
}

/**
 * Recommends bans by asking: "if the enemy picked this hero next, how
 * dangerous would it be against our current draft?" — i.e. we score the
 * candidate as if the *enemy* were picking it, from the enemy's seat.
 */
export class BanRecommender {
  recommend(available: Hero[], ctx: BanContext, topN = 5): BanCandidate[] {
    const scored = available.map((hero) => {
      const candidate = pickScorer.score(hero, {
        allyTeam: ctx.enemyTeam, // scoring from the enemy's perspective
        enemyTeam: ctx.allyTeam,
        openPositions: [1, 2, 3, 4, 5],
        liveStats: ctx.liveStats,
        weights: DEFAULT_WEIGHTS,
      });
      // Prefer the most concrete, hero-specific reasoning (counter/synergy)
      // over generic factors like lane compatibility or flexibility.
      const priority = ['counter', 'synergy', 'enemyThreatResponse', 'teamfightSynergy'] as const;
      let topReason: string | undefined;
      for (const key of priority) {
        const factor = candidate.factors.find((f) => f.key === key);
        if (factor && factor.confidence !== 'insufficient' && factor.score >= 60 && factor.reasons[0]) {
          topReason = factor.reasons[0];
          break;
        }
      }
      topReason ??= candidate.strengths[0] ?? `Would be a strong, flexible pick for the enemy against your current draft.`;
      return { heroId: hero.id, score: candidate.overallScore, reason: topReason };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, topN);
  }
}

export const banRecommender = new BanRecommender();
