import type { Hero, HeroLiveStats } from '../types/hero';
import type { DraftState } from '../types/draft';
import { unavailableHeroIds } from '../types/draft';
import type { DraftAnalysis, PickCandidate, ScoreWeights, ThreatTier } from '../types/scoring';
import type { PlayerProfile } from '../types/player';
import { getHero, ALL_HEROES } from '../data/heroes';
import { roleAnalyzer } from './RoleAnalyzer';
import { counterEngine } from './CounterEngine';
import { pickScorer } from './PickScorer';
import { banRecommender } from './BanRecommender';
import { classifyRecommendations } from './RecommendationClassifier';
import { winConditionEngine } from './WinConditionEngine';

function tierFor(index: number): ThreatTier {
  if (index === 0) return 'primary';
  if (index <= 2) return 'secondary';
  return 'tertiary';
}

function resolveTeam(slots: { heroId: string | null }[]): Hero[] {
  return slots
    .map((s) => (s.heroId ? getHero(s.heroId) : undefined))
    .filter((h): h is Hero => !!h);
}

export interface AnalyzeOptions {
  weights: ScoreWeights;
  liveStats: Map<string, HeroLiveStats>;
  topN?: number;
  playerProfile?: PlayerProfile;
}

/**
 * Top-level orchestrator: turns a DraftState into a full DraftAnalysis
 * (issues, enemy threats, recommended bans, ranked pick candidates).
 * This is pure, synchronous, and deterministic given the same inputs —
 * all the heavy AI-facing text generation happens one layer up (ai/).
 */
export class DraftAnalyzer {
  analyze(draft: DraftState, opts: AnalyzeOptions): DraftAnalysis {
    const allyTeam = resolveTeam(draft.ally);
    const enemyTeam = resolveTeam(draft.enemy);
    const unavailable = unavailableHeroIds(draft);
    const available = ALL_HEROES.filter((h) => !unavailable.has(h.id));
    const openPositions = roleAnalyzer.openPositions(draft.ally);

    const allyIssues = roleAnalyzer.analyzeIssues(allyTeam, enemyTeam);

    const enemyThreats = enemyTeam
      .map((e) => {
        const { threatLevel, reason } = counterEngine.threatAgainstTeam(e, allyTeam);
        return { heroId: e.id, threatLevel, reason };
      })
      .sort((a, b) => b.threatLevel - a.threatLevel)
      .map((t, i) => ({ ...t, tier: tierFor(i) }));

    const heroesById = new Map(available.map((h) => [h.id, h]));
    const unscored: PickCandidate[] = available.map((hero) =>
      pickScorer.score(hero, {
        allyTeam,
        enemyTeam,
        openPositions,
        liveStats: opts.liveStats,
        weights: opts.weights,
        playerProfile: opts.playerProfile,
      })
    );
    const classified = classifyRecommendations(unscored, heroesById, opts.playerProfile);
    const bestPicks: PickCandidate[] = classified
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, opts.topN ?? 10);

    const banCandidates = banRecommender.recommend(available, { allyTeam, enemyTeam, liveStats: opts.liveStats });
    const recommendedBans = banCandidates.map((b) => ({ heroId: b.heroId, reason: b.reason, score: b.score, type: 'bestBan' as const }));

    return {
      allyIssues,
      enemyThreats,
      recommendedBans,
      bestPicks,
      patch: draft.patch,
      generatedAt: new Date().toISOString(),
      allyWinCondition: winConditionEngine.evaluate(allyTeam),
      enemyWinCondition: winConditionEngine.evaluate(enemyTeam),
    };
  }

  /** Score a single explicit candidate (used by Pick Explorer / Compare). */
  scoreHero(heroId: string, draft: DraftState, opts: AnalyzeOptions): PickCandidate | undefined {
    const hero = getHero(heroId);
    if (!hero) return undefined;
    const allyTeam = resolveTeam(draft.ally);
    const enemyTeam = resolveTeam(draft.enemy);
    const openPositions = roleAnalyzer.openPositions(draft.ally);
    return pickScorer.score(hero, {
      allyTeam,
      enemyTeam,
      openPositions,
      liveStats: opts.liveStats,
      weights: opts.weights,
      playerProfile: opts.playerProfile,
    });
  }

  /**
   * "What-If": simulates picking `heroId` for the ally team and returns the
   * draft analysis before and after, so the UI can show a concrete
   * before/after/difference rather than just a single score.
   */
  whatIf(heroId: string, draft: DraftState, opts: AnalyzeOptions): { before: DraftAnalysis; after: DraftAnalysis } | undefined {
    const hero = getHero(heroId);
    if (!hero) return undefined;
    const before = this.analyze(draft, opts);
    const openSlotIndex = draft.ally.findIndex((s) => !s.heroId);
    if (openSlotIndex === -1) return { before, after: before };
    const nextAlly = draft.ally.map((s, i) => (i === openSlotIndex ? { ...s, heroId } : s));
    const after = this.analyze({ ...draft, ally: nextAlly }, opts);
    return { before, after };
  }
}

export const draftAnalyzer = new DraftAnalyzer();
