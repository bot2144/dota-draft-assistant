import type { ScoreWeights } from '../types/scoring';

/**
 * Default scoring weights. These are plain, editable configuration — not
 * hardcoded into the engine — so they can be tuned from Settings without
 * touching any analytics code. Values are fractions that should sum to 1;
 * `normalizeWeights` re-normalizes automatically if the user's edits don't.
 */
export const DEFAULT_WEIGHTS: ScoreWeights = {
  counter: 0.2,
  synergy: 0.16,
  roleCompletion: 0.12,
  laneCompatibility: 0.08,
  teamfightSynergy: 0.09,
  enemyThreatResponse: 0.09,
  metaRelevance: 0.05,
  flexibility: 0.04,
  scaling: 0.06,
  timing: 0.05,
  executionFit: 0.03,
  draftBalance: 0.03,
};

export function normalizeWeights(weights: ScoreWeights): ScoreWeights {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total <= 0) return DEFAULT_WEIGHTS;
  const out = {} as ScoreWeights;
  for (const key of Object.keys(weights) as (keyof ScoreWeights)[]) {
    out[key] = weights[key] / total;
  }
  return out;
}

export const WEIGHT_LABELS: Record<keyof ScoreWeights, string> = {
  counter: 'Counter effectiveness',
  synergy: 'Team synergy',
  roleCompletion: 'Role completion',
  laneCompatibility: 'Lane compatibility',
  teamfightSynergy: 'Teamfight synergy',
  enemyThreatResponse: 'Enemy threat response',
  metaRelevance: 'Meta relevance',
  flexibility: 'Flexibility',
  scaling: 'Scaling curve fit',
  timing: 'Timing window vs enemy',
  executionFit: 'Execution difficulty fit',
  draftBalance: 'Draft balance (damage/timing mix)',
};
