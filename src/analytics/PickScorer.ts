import type { Hero, HeroLiveStats } from '../types/hero';
import type { FactorScore, PickCandidate, ScoreWeights } from '../types/scoring';
import type { PlayerProfile } from '../types/player';
import { counterEngine } from './CounterEngine';
import { synergyEngine } from './SynergyEngine';
import { roleAnalyzer } from './RoleAnalyzer';
import { normalizeWeights } from './weights.config';
import { scalingScore, timingScore, executionFitScore, draftBalanceScore } from './TimingScalingEngine';
import { computePlayerFit } from './RecommendationClassifier';

export interface ScoringContext {
  allyTeam: Hero[];
  enemyTeam: Hero[];
  openPositions: number[];
  liveStats: Map<string, HeroLiveStats>;
  weights: ScoreWeights;
  playerProfile?: PlayerProfile;
}

function metaRelevanceScore(hero: Hero, liveStats: Map<string, HeroLiveStats>): FactorScore {
  const stats = liveStats.get(hero.id);
  if (!stats || stats.winRate === undefined) {
    return {
      key: 'metaRelevance',
      score: 50,
      confidence: 'insufficient',
      reasons: ['Insufficient data — no live win-rate statistics available for this patch.'],
    };
  }
  const score = Math.max(0, Math.min(100, 50 + (stats.winRate - 50) * 2));
  const reasons = [
    `${stats.winRate.toFixed(1)}% win rate` +
      (stats.pickRate !== undefined ? `, ${stats.pickRate.toFixed(1)}% pick rate` : '') +
      ` (source: ${stats.source}).`,
  ];
  return { key: 'metaRelevance', score, confidence: 'live', reasons };
}

function flexibilityScore(hero: Hero): FactorScore {
  const score = Math.max(
    0,
    Math.min(100, 30 + hero.positions.length * 12 + hero.roles.length * 6)
  );
  return {
    key: 'flexibility',
    score,
    confidence: 'estimated',
    reasons: [
      `Viable in ${hero.positions.length} position(s) across ${hero.roles.length} role(s), keeping the draft adaptable.`,
    ],
  };
}

function enemyThreatResponseScore(hero: Hero, enemyTeam: Hero[]): FactorScore {
  if (enemyTeam.length === 0) {
    return { key: 'enemyThreatResponse', score: 50, confidence: 'insufficient', reasons: ['No enemy picks yet to respond to.'] };
  }
  // How well this hero answers the single most threatening enemy hero
  // (highest raw capability burst/teamfight/control as a proxy for "scary").
  const scored = enemyTeam
    .map((e) => ({ e, danger: e.capability.burst + e.capability.teamfight + e.capability.control }))
    .sort((a, b) => b.danger - a.danger);
  const biggestThreat = scored[0].e;
  const matchup = counterEngine.matchup(hero, biggestThreat);
  const score = Math.max(0, Math.min(100, 50 + matchup.advantage * 16.67));
  return {
    key: 'enemyThreatResponse',
    score,
    confidence: matchup.confidence,
    reasons: [`Vs biggest threat ${biggestThreat.localizedName}: ${matchup.reason}`],
  };
}

const STRENGTH_THRESHOLD = 65;
const RISK_THRESHOLD = 40;

function deriveStrengthsRisks(hero: Hero, factors: FactorScore[]): { strengths: string[]; risks: string[] } {
  const strengths: string[] = [];
  const risks: string[] = [];

  for (const f of factors) {
    if (f.confidence === 'insufficient') continue;
    if (f.score >= STRENGTH_THRESHOLD) strengths.push(...f.reasons);
    else if (f.score <= RISK_THRESHOLD) risks.push(...f.reasons);
  }

  if (hero.tags.includes('weak-laner')) risks.push(`${hero.localizedName} has a weak laning phase and needs protection early.`);
  if (hero.tags.includes('strong-laner')) strengths.push(`${hero.localizedName} has a strong, safe laning phase.`);
  if (hero.complexity === 3) risks.push('High execution difficulty — mechanically demanding to play well.');
  if (hero.notes) risks.push(hero.notes);

  return {
    strengths: Array.from(new Set(strengths)).slice(0, 5),
    risks: Array.from(new Set(risks)).slice(0, 5),
  };
}

export class PickScorer {
  computeFactors(hero: Hero, ctx: ScoringContext): FactorScore[] {
    return [
      counterEngine.scoreAgainstTeam(hero, ctx.enemyTeam),
      synergyEngine.scoreWithTeam(hero, ctx.allyTeam),
      roleAnalyzer.roleCompletionScore(hero, ctx.allyTeam),
      roleAnalyzer.laneCompatibilityScore(hero, ctx.openPositions),
      synergyEngine.teamfightScore(hero, ctx.allyTeam),
      enemyThreatResponseScore(hero, ctx.enemyTeam),
      metaRelevanceScore(hero, ctx.liveStats),
      flexibilityScore(hero),
      scalingScore(hero, ctx.allyTeam),
      timingScore(hero, ctx.enemyTeam),
      executionFitScore(hero),
      draftBalanceScore(hero, ctx.allyTeam),
    ];
  }

  score(hero: Hero, ctx: ScoringContext): PickCandidate {
    const factors = this.computeFactors(hero, ctx);
    const weights = normalizeWeights(ctx.weights);
    const overall = factors.reduce((sum, f) => sum + f.score * weights[f.key], 0);

    const { strengths, risks } = deriveStrengthsRisks(hero, factors);
    const suggestedPosition = hero.positions.find((p) => ctx.openPositions.includes(p)) ?? hero.positions[0];

    const candidate: PickCandidate = {
      heroId: hero.id,
      overallScore: Math.round(Math.max(0, Math.min(100, overall))),
      factors,
      strengths,
      risks,
      suggestedPosition,
      recommendationTypes: [],
    };

    if (ctx.playerProfile?.enabled) {
      candidate.playerFit = Math.round(computePlayerFit(hero, candidate, ctx.playerProfile));
    }

    return candidate;
  }
}

export const pickScorer = new PickScorer();
