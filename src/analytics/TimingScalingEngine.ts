import type { Hero } from '../types/hero';
import type { FactorScore } from '../types/scoring';

/**
 * Scaling & timing are modeled from each hero's curated `scaling` curve
 * (Early/Mid/Late/Flexible) and capability vector — never from invented
 * win-rate-by-minute numbers we don't have. Everything here is tagged
 * 'estimated' (derived from curated design data) rather than 'live'.
 */

const PHASE_WEIGHT: Record<Hero['scaling'], number> = {
  Early: 0,
  Mid: 1,
  Late: 2,
  Flexible: 1,
};

/** How well this hero's own scaling curve rounds out the ally team's power curve (avoids an all-late-game or all-early-game draft). */
export function scalingScore(hero: Hero, allyTeam: Hero[]): FactorScore {
  if (allyTeam.length === 0) {
    return {
      key: 'scaling',
      score: 60,
      confidence: 'estimated',
      reasons: [`${hero.localizedName} has a ${hero.scaling.toLowerCase()}-game-leaning power curve.`],
    };
  }
  const counts = { Early: 0, Mid: 0, Late: 0, Flexible: 0 } as Record<Hero['scaling'], number>;
  for (const h of allyTeam) counts[h.scaling] += 1;
  const dominant = (Object.keys(counts) as Hero['scaling'][]).reduce((a, b) => (counts[a] >= counts[b] ? a : b));
  const isFillingGap = hero.scaling !== dominant || hero.scaling === 'Flexible';
  const score = isFillingGap ? 72 : 45;
  const reason = isFillingGap
    ? `Adds a ${hero.scaling.toLowerCase()}-game option, balancing a team currently leaning ${dominant.toLowerCase()}-game.`
    : `Another ${hero.scaling.toLowerCase()}-game hero — the team's power curve is stacking into one phase.`;
  return { key: 'scaling', score, confidence: 'estimated', reasons: [reason] };
}

/** Whether this hero's timing window lines up favorably against the enemy's current aggregate timing window. */
export function timingScore(hero: Hero, enemyTeam: Hero[]): FactorScore {
  if (enemyTeam.length === 0) {
    return { key: 'timing', score: 55, confidence: 'insufficient', reasons: ['No enemy picks yet to compare timing windows against.'] };
  }
  const ourPhase = PHASE_WEIGHT[hero.scaling];
  const enemyAvgPhase = enemyTeam.reduce((sum, h) => sum + PHASE_WEIGHT[h.scaling], 0) / enemyTeam.length;
  const diff = ourPhase - enemyAvgPhase;
  // A hero whose own timing window arrives earlier than the enemy's average
  // has an opening to punish before the enemy comes online (and vice versa).
  const score = Math.max(0, Math.min(100, 55 - diff * 14));
  let reason: string;
  if (diff < -0.4) reason = `${hero.localizedName} tends to come online earlier than this enemy lineup — a window to press an advantage before they scale.`;
  else if (diff > 0.4) reason = `${hero.localizedName} scales later than this enemy lineup — needs to survive their earlier timing window first.`;
  else reason = `${hero.localizedName}'s timing window roughly matches this enemy lineup's.`;
  return { key: 'timing', score, confidence: 'estimated', reasons: [reason] };
}

/** How well the hero's execution difficulty fits — lower complexity scores higher by default (safer under draft pressure), surfaced as its own transparent factor rather than folded silently into risk text. */
export function executionFitScore(hero: Hero): FactorScore {
  const score = hero.complexity === 1 ? 80 : hero.complexity === 2 ? 60 : 38;
  const reason =
    hero.complexity === 1
      ? `${hero.localizedName} is mechanically straightforward — low execution risk.`
      : hero.complexity === 2
        ? `${hero.localizedName} has moderate mechanical demands.`
        : `${hero.localizedName} is mechanically demanding — high execution risk if under-practiced.`;
  return { key: 'executionFit', score, confidence: 'curated', reasons: [reason] };
}

/** How much this pick improves (or worsens) the team's damage-type and scaling-curve mix — a lightweight, per-pick view of the same idea DraftScore.ts uses at the whole-draft level. */
export function draftBalanceScore(hero: Hero, allyTeam: Hero[]): FactorScore {
  if (allyTeam.length === 0) {
    return { key: 'draftBalance', score: 60, confidence: 'estimated', reasons: ['First pick — no balance to check yet.'] };
  }
  const damageCounts: Record<string, number> = {};
  for (const h of allyTeam) damageCounts[h.damageType] = (damageCounts[h.damageType] ?? 0) + 1;
  const wouldStack = (damageCounts[hero.damageType] ?? 0) >= 3;
  const scaling = scalingScore(hero, allyTeam);
  const score = wouldStack ? Math.min(scaling.score, 45) : scaling.score;
  const reason = wouldStack
    ? `Draft is already heavy on ${hero.damageType.toLowerCase()} damage — enemies could itemize a single answer.`
    : `Keeps the draft's damage-type mix reasonably diverse.`;
  return { key: 'draftBalance', score, confidence: 'estimated', reasons: [reason] };
}
