import type { Hero } from '../types/hero';
import type { DraftIssue } from '../types/scoring';
import { synergyEngine } from './SynergyEngine';
import { roleAnalyzer } from './RoleAnalyzer';

const SEVERITY_PENALTY = { high: 12, medium: 6, low: 2 };

export interface DraftScoreResult {
  score: number; // 0-100
  roleCoverageScore: number;
  synergyScore: number;
  teamfightScore: number;
  powerCurve: { early: number; mid: number; late: number; flexible: number };
}

/**
 * Composite "how good is this 5-hero composition, as a unit" score for the
 * Draft Simulator sandbox — distinct from PickScorer, which scores a single
 * candidate hero joining a partial draft.
 */
export function computeDraftScore(allyTeam: Hero[], issues: DraftIssue[]): DraftScoreResult {
  if (allyTeam.length === 0) {
    return { score: 50, roleCoverageScore: 50, synergyScore: 50, teamfightScore: 50, powerCurve: { early: 0, mid: 0, late: 0, flexible: 0 } };
  }

  const missing = roleAnalyzer.missingRoles(allyTeam);
  const roleCoverageScore = Math.max(0, 100 - missing.length * 15);

  let synergySum = 0;
  let pairs = 0;
  for (let i = 0; i < allyTeam.length; i++) {
    for (let j = i + 1; j < allyTeam.length; j++) {
      synergySum += synergyEngine.pairSynergy(allyTeam[i], allyTeam[j]).strength;
      pairs++;
    }
  }
  const synergyScore = pairs > 0 ? Math.min(100, 40 + (synergySum / pairs) * 20) : 50;

  const teamfightScore = Math.min(
    100,
    (allyTeam.reduce((s, h) => s + h.capability.teamfight + h.capability.aoe + h.capability.control, 0) /
      (allyTeam.length * 9)) *
      100
  );

  const powerCurve = { early: 0, mid: 0, late: 0, flexible: 0 };
  for (const h of allyTeam) {
    if (h.scaling === 'Early') powerCurve.early++;
    else if (h.scaling === 'Mid') powerCurve.mid++;
    else if (h.scaling === 'Late') powerCurve.late++;
    else powerCurve.flexible++;
  }

  const penalty = issues.reduce((sum, i) => sum + SEVERITY_PENALTY[i.severity], 0);
  const base = roleCoverageScore * 0.35 + synergyScore * 0.35 + teamfightScore * 0.3;
  const score = Math.max(0, Math.min(100, base - penalty));

  return { score: Math.round(score), roleCoverageScore, synergyScore, teamfightScore, powerCurve };
}
