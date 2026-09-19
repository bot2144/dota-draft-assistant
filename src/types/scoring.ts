/** Factor identifiers used across the scoring config, engine, and UI ("WHY?" bars). */
export type ScoreFactorKey =
  | 'counter'
  | 'synergy'
  | 'roleCompletion'
  | 'laneCompatibility'
  | 'teamfightSynergy'
  | 'enemyThreatResponse'
  | 'metaRelevance'
  | 'flexibility'
  | 'scaling'
  | 'timing'
  | 'executionFit'
  | 'draftBalance';

export type ScoreWeights = Record<ScoreFactorKey, number>;

export interface FactorScore {
  key: ScoreFactorKey;
  /** 0-100 */
  score: number;
  /** Whether this factor had real supporting data or is a heuristic estimate. */
  confidence: 'curated' | 'estimated' | 'live' | 'insufficient';
  /** Short bullet reasons feeding this factor, for the WHY breakdown. */
  reasons: string[];
}

/**
 * Reflects a real, derived property of the candidate (score distribution,
 * complexity, variance across factors) — never just a cosmetic UI label.
 * - bestPick: highest objective score among current candidates.
 * - alternative: close behind the best pick (within a small margin).
 * - safePick: high floor — no low-scoring ("risk") factors, low complexity.
 * - highCeiling: strong ceiling but carries real risk factors and/or high
 *   execution difficulty — rewarding if played well, punishing if not.
 * - comfortPick: matches the player's own stated comfort-hero pool
 *   (only assigned when a player profile with comfort heroes is set).
 */
export type RecommendationType = 'bestPick' | 'alternative' | 'safePick' | 'highCeiling' | 'comfortPick';

export interface PickCandidate {
  heroId: string;
  /** 0-100 overall weighted score, purely objective (never adjusted by player profile). */
  overallScore: number;
  factors: FactorScore[];
  strengths: string[];
  risks: string[];
  suggestedPosition?: number;
  recommendationTypes: RecommendationType[];
  /**
   * 0-100 fit with the player's own stated profile (comfort heroes,
   * preferred roles, avoid list). Present only when a profile is set.
   * Always kept separate from `overallScore` — never blended into it.
   */
  playerFit?: number;
}

export interface DraftIssue {
  type:
    | 'missing-role'
    | 'no-initiation'
    | 'no-magic-immune-answer'
    | 'no-lockdown'
    | 'illusion-vulnerable'
    | 'physical-damage-only'
    | 'magical-damage-only'
    | 'no-detection'
    | 'no-save'
    | 'poor-scaling'
    | 'over-reliant-on-hero';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export type ThreatTier = 'primary' | 'secondary' | 'tertiary';

export interface EnemyThreat {
  heroId: string;
  threatLevel: number; // 0-100
  reason: string;
  /** primary = single biggest threat, secondary = next two, tertiary = the rest. */
  tier: ThreatTier;
}

export type GamePhase = 'early' | 'mid' | 'late';

/** A team's win condition as derived from its heroes' capability/scaling data — never asserted with false certainty. */
export interface WinCondition {
  dominantPhase: GamePhase;
  /** 0-100, how pronounced/reliable this win condition looks given the picks so far. */
  strength: number;
  description: string;
  confidence: 'estimated' | 'insufficient';
}

export interface DraftAnalysis {
  allyIssues: DraftIssue[];
  enemyThreats: EnemyThreat[];
  recommendedBans: { heroId: string; reason: string; score: number; type: 'bestBan' | 'biggestThreat' }[];
  bestPicks: PickCandidate[];
  patch: string;
  generatedAt: string;
  allyWinCondition?: WinCondition;
  enemyWinCondition?: WinCondition;
}

export interface BanCandidate {
  heroId: string;
  score: number;
  reason: string;
}
