import type { Hero } from '../types/hero';
import { CURATED_SYNERGIES } from '../data/curatedSynergies';
import type { FactorScore } from '../types/scoring';

const CURATED_INDEX = new Map<string, { strength: number; reason: string }>();
for (const s of CURATED_SYNERGIES) {
  CURATED_INDEX.set(pairKey(s.heroA, s.heroB), { strength: s.strength, reason: s.reason });
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('::');
}

export interface PairSynergy {
  withHeroId: string;
  strength: number; // 0-3
  reason: string;
  confidence: 'curated' | 'estimated';
}

/**
 * Level-1 data engine for ally synergy: curated combo overrides layered on
 * a capability-tag heuristic (chain-control, follow-up burst, save+commit).
 */
export class SynergyEngine {
  pairSynergy(a: Hero, b: Hero): PairSynergy {
    const curated = CURATED_INDEX.get(pairKey(a.id, b.id));
    if (curated) {
      return { withHeroId: b.id, strength: curated.strength, reason: curated.reason, confidence: 'curated' };
    }

    let strength = 0;
    const reasons: string[] = [];
    const hasTag = (h: Hero, t: string) => h.tags.includes(t as never);

    // Both bring AoE stun / teamwipe ultimates -> chain potential.
    if (
      (hasTag(a, 'aoe-stun') || hasTag(a, 'teamwipe-ultimate')) &&
      (hasTag(b, 'aoe-stun') || hasTag(b, 'teamwipe-ultimate'))
    ) {
      strength += 1;
      reasons.push(`Overlapping AoE control/ultimates create a strong chain-lockdown window.`);
    }

    // Pick-off setup + burst finisher.
    if (hasTag(a, 'pick-off') && b.capability.burst >= 2) {
      strength += 1;
      reasons.push(`${a.localizedName} isolates a target for ${b.localizedName} to burst down.`);
    }

    // Healer/durable + carry.
    if (hasTag(a, 'healer') && b.roles.includes('Carry')) {
      strength += 1;
      reasons.push(`Sustain from ${a.localizedName} keeps ${b.localizedName} alive to farm and fight.`);
    }

    // Global presence / mobility save.
    if (hasTag(a, 'global-presence') && b.capability.tankiness <= 1) {
      strength += 1;
      reasons.push(`${a.localizedName} can reposition or save a squishy ${b.localizedName} from anywhere.`);
    }

    strength = Math.max(0, Math.min(3, strength));
    return {
      withHeroId: b.id,
      strength,
      reason: reasons[0] ?? 'No standout combo detected — solid but generic pairing.',
      confidence: 'estimated',
    };
  }

  /** Overall synergy of `hero` joining the current ally team, as a 0-100 factor score. */
  scoreWithTeam(hero: Hero, allyTeam: Hero[]): FactorScore {
    if (allyTeam.length === 0) {
      return {
        key: 'synergy',
        score: 50,
        confidence: 'insufficient',
        reasons: ['No allies picked yet — synergy cannot be evaluated.'],
      };
    }
    const pairs = allyTeam.map((ally) => this.pairSynergy(hero, ally));
    const avgStrength = pairs.reduce((s, p) => s + p.strength, 0) / pairs.length;
    const score = Math.max(0, Math.min(100, 40 + avgStrength * 20)); // 0 avg -> 40 (neutral-ish), 3 avg -> 100

    const sorted = [...pairs].sort((a, b) => b.strength - a.strength);
    const reasons = sorted.filter((p) => p.strength > 0).slice(0, 2).map((p) => p.reason);
    const anyCurated = pairs.some((p) => p.confidence === 'curated');

    return {
      key: 'synergy',
      score,
      confidence: anyCurated ? 'curated' : 'estimated',
      reasons: reasons.length ? reasons : ['No standout combos — fits in without friction.'],
    };
  }

  /** Teamfight-specific synergy: how well combined AoE/control/burst convert into fight-winning potential. */
  teamfightScore(hero: Hero, allyTeam: Hero[]): FactorScore {
    const combined = [hero, ...allyTeam];
    const totalAoe = combined.reduce((s, h) => s + h.capability.aoe, 0);
    const totalControl = combined.reduce((s, h) => s + h.capability.control, 0);
    const totalTeamfight = combined.reduce((s, h) => s + h.capability.teamfight, 0);
    const n = combined.length;
    const avg = (totalAoe + totalControl + totalTeamfight) / (n * 9); // each capped ~3, 3 stats
    const score = Math.max(0, Math.min(100, avg * 100));

    const reasons: string[] = [];
    if (hero.capability.teamfight >= 2) reasons.push(`${hero.localizedName}'s ultimate has strong 5v5 impact.`);
    if (hero.capability.aoe >= 2 && totalControl - hero.capability.control >= 3) {
      reasons.push('Combines well with existing control to convert into AoE damage.');
    }
    if (!reasons.length) reasons.push('Moderate teamfight contribution relative to the current lineup.');

    return { key: 'teamfightSynergy', score, confidence: allyTeam.length ? 'estimated' : 'insufficient', reasons };
  }
}

export const synergyEngine = new SynergyEngine();
