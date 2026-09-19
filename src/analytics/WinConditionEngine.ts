import type { Hero } from '../types/hero';
import type { GamePhase, WinCondition } from '../types/scoring';

/**
 * Derives a team's likely win condition purely from curated hero data
 * (scaling curve + capability vector) already in the data layer — never
 * from invented match statistics. With fewer than 2 heroes picked the
 * signal is too thin to call a phase, so this returns 'insufficient'
 * confidence rather than guessing.
 */
export class WinConditionEngine {
  evaluate(team: Hero[]): WinCondition | undefined {
    if (team.length === 0) return undefined;
    if (team.length < 2) {
      return {
        dominantPhase: this.phaseFor(team[0]),
        strength: 25,
        description: `Only one hero picked so far — too early to call a team win condition.`,
        confidence: 'insufficient',
      };
    }

    const phaseCounts: Record<GamePhase, number> = { early: 0, mid: 0, late: 0 };
    for (const h of team) phaseCounts[this.phaseFor(h)] += 1;

    const dominantPhase = (Object.keys(phaseCounts) as GamePhase[]).reduce((a, b) =>
      phaseCounts[a] >= phaseCounts[b] ? a : b
    );

    const avgTeamfight = team.reduce((s, h) => s + h.capability.teamfight, 0) / team.length;
    const avgPush = team.reduce((s, h) => s + h.capability.pushing, 0) / team.length;
    const hasPickOff = team.some((h) => h.tags.includes('pick-off'));
    const hasSplitPush = team.some((h) => h.tags.includes('split-push'));

    const strength = Math.round(Math.min(100, 40 + (phaseCounts[dominantPhase] / team.length) * 60));

    const shape = hasSplitPush && avgPush >= 1.5
      ? 'split-push map pressure'
      : avgTeamfight >= 1.8
        ? 'group teamfights around key ultimates'
        : hasPickOff
          ? 'pick off isolated targets before grouping'
          : 'grind objectives through steady lane/farm advantage';

    const phaseLabel = dominantPhase === 'early' ? 'early game' : dominantPhase === 'mid' ? 'mid game' : 'late game';

    return {
      dominantPhase,
      strength,
      description: `Leans toward the ${phaseLabel}, aiming to ${shape}.`,
      confidence: 'estimated',
    };
  }

  private phaseFor(hero: Hero): GamePhase {
    if (hero.scaling === 'Early') return 'early';
    if (hero.scaling === 'Late') return 'late';
    return 'mid'; // Mid and Flexible both bucket as the swing phase absent more data.
  }
}

export const winConditionEngine = new WinConditionEngine();
