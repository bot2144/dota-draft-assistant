import type { Hero } from '../types/hero';
import { CURATED_MATCHUPS } from '../data/curatedMatchups';
import type { FactorScore } from '../types/scoring';

const CURATED_INDEX = new Map<string, number>();
const CURATED_REASON = new Map<string, string>();
for (const m of CURATED_MATCHUPS) {
  CURATED_INDEX.set(`${m.heroId}->${m.vsHeroId}`, m.advantage);
  CURATED_REASON.set(`${m.heroId}->${m.vsHeroId}`, m.reason);
}

export interface DirectedMatchup {
  vsHeroId: string;
  /** -3..3, positive = hero advantage over vsHero */
  advantage: number;
  reason: string;
  confidence: 'curated' | 'estimated';
}

/**
 * Level-1 data engine: computes transparent, explainable matchup advantage
 * between two heroes from curated overrides layered on top of a capability
 * heuristic. This is a design-judgment model, not a statistic — it never
 * claims to be a win-rate percentage.
 */
export class CounterEngine {
  /** Directed advantage of `hero` over `vs`, from hero's perspective. */
  matchup(hero: Hero, vs: Hero): DirectedMatchup {
    const key = `${hero.id}->${vs.id}`;
    if (CURATED_INDEX.has(key)) {
      return {
        vsHeroId: vs.id,
        advantage: CURATED_INDEX.get(key)!,
        reason: CURATED_REASON.get(key)!,
        confidence: 'curated',
      };
    }

    let advantage = 0;
    const reasons: string[] = [];
    const hasTag = (h: Hero, t: string) => h.tags.includes(t as never);

    // Control vs mobility: hard disable beats an escape-reliant hero.
    const controlGap = hero.capability.control - vs.capability.mobility;
    if (controlGap >= 2) {
      advantage += 1;
      reasons.push(`${hero.localizedName}'s control outclasses ${vs.localizedName}'s limited escape options.`);
    } else if (controlGap <= -2) {
      advantage -= 1;
    }

    // Illusion clear / AoE vs illusion-based heroes.
    if ((hasTag(hero, 'illusion-clear') || hero.capability.aoe >= 2) && hasTag(vs, 'illusions')) {
      advantage += 2;
      reasons.push(`Splash/cleave damage shreds ${vs.localizedName}'s illusions.`);
    }

    // Detection vs invisibility.
    if (hasTag(hero, 'detection') && hasTag(vs, 'invisibility')) {
      advantage += 2;
      reasons.push(`Detection negates ${vs.localizedName}'s invisibility play.`);
    }

    // Silence/lockdown vs channeled ultimates.
    if ((hasTag(hero, 'silence') || hasTag(hero, 'lockdown')) && hasTag(vs, 'channeling-ultimate')) {
      advantage += 2;
      reasons.push(`Disable/silence interrupts ${vs.localizedName}'s channeled ultimate.`);
    }

    // Armor reduction / true strike vs evasion.
    if (hasTag(hero, 'armor-reduction') && hasTag(vs, 'evasion')) {
      advantage += 1;
      reasons.push(`Damage amplification cuts through ${vs.localizedName}'s evasion.`);
    }

    // Pure damage bypasses stacked armor/tankiness.
    if (hero.damageType === 'Pure' && vs.capability.tankiness >= 3) {
      advantage += 1;
      reasons.push(`Pure damage ignores ${vs.localizedName}'s armor stacking.`);
    }

    // Anti-kite vs ranged, mobile, low-tank kiting heroes.
    if (
      hero.capability.control + (hasTag(hero, 'anti-kite') ? 1 : 0) >= 2 &&
      vs.attackType === 'Ranged' &&
      vs.capability.mobility >= 1 &&
      vs.capability.tankiness <= 1
    ) {
      advantage += 1;
      reasons.push(`Anti-kite tools pin down a fragile ranged attacker.`);
    }

    // Melee, low-mobility hero vs a highly mobile kiting hero.
    if (hero.attackType === 'Melee' && hero.capability.mobility <= 1 && vs.capability.mobility >= 2) {
      advantage -= 1;
    }

    // Healing denial / dispel vs sustain-heavy target.
    if ((hasTag(hero, 'healer') || hasTag(hero, 'dispel-heavy')) && vs.capability.burst >= 3) {
      advantage += 1;
      reasons.push(`Sustain/dispel blunts ${vs.localizedName}'s burst windows.`);
    }

    // Break vs sustain.
    if (hasTag(hero, 'break') && vs.capability.sustain >= 2) {
      advantage += 1;
      reasons.push(`Break negates ${vs.localizedName}'s regeneration/lifesteal.`);
    }

    advantage = Math.max(-3, Math.min(3, advantage));

    return {
      vsHeroId: vs.id,
      advantage,
      reason: reasons[0] ?? `Neutral matchup based on kit fundamentals.`,
      confidence: 'estimated',
    };
  }

  /** Aggregate advantage of `hero` against a whole enemy team, as a 0-100 factor score. */
  scoreAgainstTeam(hero: Hero, enemyTeam: Hero[]): FactorScore {
    if (enemyTeam.length === 0) {
      return {
        key: 'counter',
        score: 50,
        confidence: 'insufficient',
        reasons: ['No enemy heroes picked yet — counter potential cannot be evaluated.'],
      };
    }

    const matchups = enemyTeam.map((vs) => this.matchup(hero, vs));
    const avgAdvantage = matchups.reduce((s, m) => s + m.advantage, 0) / matchups.length;
    const score = Math.max(0, Math.min(100, 50 + avgAdvantage * 16.67));

    const sorted = [...matchups].sort((a, b) => b.advantage - a.advantage);
    const reasons = [
      ...sorted.filter((m) => m.advantage > 0).slice(0, 2).map((m) => m.reason),
      ...sorted.filter((m) => m.advantage < 0).slice(-1).map((m) => m.reason),
    ];

    const anyCurated = matchups.some((m) => m.confidence === 'curated');
    return {
      key: 'counter',
      score,
      confidence: anyCurated ? 'curated' : 'estimated',
      reasons: reasons.length ? reasons : ['No standout hard counters detected either way.'],
    };
  }

  /** Threat this enemy hero poses to our team — mirror of scoreAgainstTeam from the opponent's seat. */
  threatAgainstTeam(enemyHero: Hero, allyTeam: Hero[]): { threatLevel: number; reason: string } {
    if (allyTeam.length === 0) {
      return { threatLevel: 50, reason: 'Insufficient data — no ally picks yet.' };
    }
    const matchups = allyTeam.map((ally) => this.matchup(enemyHero, ally));
    const avgAdvantage = matchups.reduce((s, m) => s + m.advantage, 0) / matchups.length;
    const threatLevel = Math.max(0, Math.min(100, 50 + avgAdvantage * 16.67));
    const worst = [...matchups].sort((a, b) => b.advantage - a.advantage)[0];
    return {
      threatLevel,
      reason: worst?.reason ?? `${enemyHero.localizedName} has no standout advantage over your draft yet.`,
    };
  }
}

export const counterEngine = new CounterEngine();
