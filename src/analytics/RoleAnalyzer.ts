import type { Hero, Role } from '../types/hero';
import type { DraftIssue, FactorScore } from '../types/scoring';

/** The role coverage a healthy 5-man draft generally wants. */
const CORE_ROLE_TARGETS: Role[] = ['Carry', 'Support', 'Initiator', 'Disabler', 'Durable'];

export class RoleAnalyzer {
  /** Roles already covered (at any strength) by the current ally team. */
  coveredRoles(allyTeam: Hero[]): Set<Role> {
    const set = new Set<Role>();
    for (const h of allyTeam) for (const r of h.roles) set.add(r);
    return set;
  }

  missingRoles(allyTeam: Hero[]): Role[] {
    const covered = this.coveredRoles(allyTeam);
    return CORE_ROLE_TARGETS.filter((r) => !covered.has(r));
  }

  /** Which of the 5 standard positions are still open, in slot order. */
  openPositions(allyTeam: { position?: number }[]): number[] {
    const taken = new Set(allyTeam.map((s) => s.position).filter(Boolean));
    return [1, 2, 3, 4, 5].filter((p) => !taken.has(p));
  }

  /** Role-completion factor score for a candidate hero joining the ally team. */
  roleCompletionScore(hero: Hero, allyTeam: Hero[]): FactorScore {
    if (allyTeam.length === 0) {
      return {
        key: 'roleCompletion',
        score: 60,
        confidence: 'estimated',
        reasons: ['First pick — any solid role fits the draft so far.'],
      };
    }
    const missing = this.missingRoles(allyTeam);
    const filled = hero.roles.filter((r) => missing.includes(r));
    const score = missing.length === 0 ? 55 : Math.min(100, 40 + (filled.length / missing.length) * 60);

    const reasons = filled.length
      ? [`Fills the missing ${filled.join('/')} role for your draft.`]
      : missing.length
        ? [`Does not address the missing ${missing.join('/')} role(s).`]
        : ['Core roles already covered — this is a flexible/luxury pick.'];

    return { key: 'roleCompletion', score, confidence: 'estimated', reasons };
  }

  /** Lane compatibility: does the hero fit an open position cleanly? */
  laneCompatibilityScore(hero: Hero, openPositions: number[]): FactorScore {
    if (openPositions.length === 0) {
      return { key: 'laneCompatibility', score: 50, confidence: 'insufficient', reasons: ['All 5 positions already assigned.'] };
    }
    const fits = hero.positions.some((p) => openPositions.includes(p));
    const bestOpenIndex = openPositions.findIndex((p) => (hero.positions as number[]).includes(p));
    const score = fits ? (bestOpenIndex === 0 ? 90 : 75) : 40;
    const reasons = fits
      ? [`Comfortable in an open position (${hero.positions.filter((p) => openPositions.includes(p)).join('/')}).`]
      : [`Natural positions (${hero.positions.join('/')}) don't cleanly match the open slots.`];
    return { key: 'laneCompatibility', score, confidence: 'estimated', reasons };
  }

  /** Structural issues in the current ally draft, independent of any specific candidate. */
  analyzeIssues(allyTeam: Hero[], enemyTeam: Hero[]): DraftIssue[] {
    const issues: DraftIssue[] = [];
    if (allyTeam.length === 0) return issues;

    const missing = this.missingRoles(allyTeam);
    for (const role of missing) {
      if (allyTeam.length >= 3) {
        issues.push({
          type: 'missing-role',
          severity: allyTeam.length >= 4 ? 'high' : 'medium',
          message: `No ${role} on your team yet.`,
        });
      }
    }

    const hasInitiation = allyTeam.some((h) => h.roles.includes('Initiator') || h.capability.control >= 2);
    if (!hasInitiation && allyTeam.length >= 3) {
      issues.push({ type: 'no-initiation', severity: 'high', message: 'No reliable initiation/hard engage on your team.' });
    }

    const enemyHasIllusions = enemyTeam.some((h) => h.tags.includes('illusions'));
    const allyHasIllusionAnswer = allyTeam.some((h) => h.tags.includes('illusion-clear') || h.capability.aoe >= 2);
    if (enemyHasIllusions && !allyHasIllusionAnswer) {
      issues.push({ type: 'illusion-vulnerable', severity: 'medium', message: 'No AoE/illusion-clear answer to the enemy illusion hero.' });
    }

    const enemyHasInvis = enemyTeam.some((h) => h.tags.includes('invisibility'));
    const allyHasDetection = allyTeam.some((h) => h.tags.includes('detection'));
    if (enemyHasInvis && !allyHasDetection && allyTeam.length >= 3) {
      issues.push({ type: 'no-detection', severity: 'medium', message: 'No detection for the enemy invisibility hero — remember Sentries/Gem too.' });
    }

    const damageTypes = new Set(allyTeam.map((h) => h.damageType));
    if (allyTeam.length >= 4 && damageTypes.size === 1 && damageTypes.has('Physical')) {
      issues.push({ type: 'physical-damage-only', severity: 'low', message: 'Entire damage profile is physical — vulnerable to armor stacking (e.g. Shiva\'s, Assault Cuirass).' });
    }
    if (allyTeam.length >= 4 && damageTypes.size === 1 && damageTypes.has('Magical')) {
      issues.push({ type: 'magical-damage-only', severity: 'low', message: 'Entire damage profile is magical — vulnerable to Pipe of Insight/Black King Bar.' });
    }

    const hasSave = allyTeam.some((h) => h.tags.includes('healer') || h.tags.includes('dispel-heavy'));
    const enemyBurstHeavy = enemyTeam.filter((h) => h.capability.burst >= 2).length >= 2;
    if (enemyBurstHeavy && !hasSave && allyTeam.length >= 3) {
      issues.push({ type: 'no-save', severity: 'medium', message: 'No dispel/heal answer to the enemy\'s burst-heavy composition.' });
    }

    const noMagicImmuneAnswer = !allyTeam.some((h) => h.tags.includes('silence') || h.tags.includes('lockdown'));
    const enemyChanneling = enemyTeam.some((h) => h.tags.includes('channeling-ultimate'));
    if (enemyChanneling && noMagicImmuneAnswer && allyTeam.length >= 3) {
      issues.push({ type: 'no-magic-immune-answer', severity: 'low', message: 'No silence/disable ready to interrupt the enemy\'s channeled ultimate.' });
    }

    return issues;
  }
}

export const roleAnalyzer = new RoleAnalyzer();
