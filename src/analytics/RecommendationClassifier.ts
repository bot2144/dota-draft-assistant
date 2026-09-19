import type { Hero } from '../types/hero';
import type { PickCandidate, RecommendationType } from '../types/scoring';
import type { PlayerProfile } from '../types/player';

/**
 * Labels reflect real, derived properties of each candidate (its rank,
 * risk-factor count, execution difficulty, and the player's own stated
 * comfort pool) — never assigned just to fill out UI variety.
 */
export function classifyRecommendations(
  candidates: PickCandidate[],
  heroesById: Map<string, Hero>,
  playerProfile?: PlayerProfile
): PickCandidate[] {
  if (candidates.length === 0) return candidates;
  const sorted = [...candidates].sort((a, b) => b.overallScore - a.overallScore);
  const topScore = sorted[0].overallScore;

  return candidates.map((c) => {
    const types: RecommendationType[] = [];
    const hero = heroesById.get(c.heroId);
    const riskCount = c.risks.length;
    const executionFactor = c.factors.find((f) => f.key === 'executionFit');

    if (c.overallScore === topScore) types.push('bestPick');
    else if (c.overallScore >= topScore - 8) types.push('alternative');

    if (riskCount === 0 && (executionFactor?.score ?? 60) >= 55) types.push('safePick');

    if (riskCount >= 2 && hero && hero.complexity >= 2 && c.overallScore >= topScore - 15) {
      types.push('highCeiling');
    }

    if (playerProfile?.enabled && playerProfile.comfortHeroIds.includes(c.heroId)) {
      types.push('comfortPick');
    }

    return { ...c, recommendationTypes: types };
  });
}

/**
 * Player Fit is intentionally a separate 0-100 number, never mixed into
 * `overallScore`. It only reflects what the player told us about
 * themselves (comfort heroes, preferred positions, heroes to avoid).
 */
export function computePlayerFit(hero: Hero, candidate: PickCandidate, profile: PlayerProfile): number {
  if (!profile.enabled) return 0;
  let score = 50;
  if (profile.comfortHeroIds.includes(hero.id)) score += 30;
  if (profile.avoidHeroIds.includes(hero.id)) score -= 45;
  if (profile.preferredPositions.length > 0 && candidate.suggestedPosition) {
    const suggested = candidate.suggestedPosition;
    if (profile.preferredPositions.some((p) => p === suggested)) score += 15;
    else score -= 10;
  }
  if (profile.experienceLevel === 'new' && hero.complexity === 3) score -= 15;
  if (profile.experienceLevel === 'competitive' && hero.complexity === 1) score -= 5;
  return Math.max(0, Math.min(100, score));
}
