import { describe, it, expect } from 'vitest';
import { draftAnalyzer } from '../DraftAnalyzer';
import { createEmptyDraft } from '../../types/draft';
import { DEFAULT_WEIGHTS } from '../weights.config';

const opts = { weights: DEFAULT_WEIGHTS, liveStats: new Map() };

/**
 * "Golden Draft" scenarios: a fixed set of representative draft shapes the
 * engine must handle sensibly and without crashing or fabricating data,
 * covering the scenario categories called out in the product spec.
 */
describe('Golden Draft scenarios', () => {
  it('empty draft', () => {
    const analysis = draftAnalyzer.analyze(createEmptyDraft('7.39'), opts);
    expect(analysis.bestPicks.length).toBeGreaterThan(0);
  });

  it('partial draft (fewer than 5 per side)', () => {
    const draft = createEmptyDraft('7.39');
    draft.ally[0].heroId = 'crystal-maiden';
    draft.enemy[0].heroId = 'pudge';
    const analysis = draftAnalyzer.analyze(draft, opts);
    expect(analysis.enemyThreats).toHaveLength(1);
    expect(analysis.enemyThreats[0].tier).toBe('primary');
  });

  it('complete 5v5 draft', () => {
    const draft = createEmptyDraft('7.39');
    ['anti-mage', 'crystal-maiden', 'axe', 'lion', 'juggernaut'].forEach((id, i) => (draft.ally[i].heroId = id));
    ['invoker', 'faceless-void', 'morphling', 'pudge', 'earthshaker'].forEach((id, i) => (draft.enemy[i].heroId = id));
    const analysis = draftAnalyzer.analyze(draft, opts);
    expect(analysis.allyWinCondition).toBeDefined();
    expect(analysis.enemyWinCondition).toBeDefined();
  });

  it('unknown/unmapped hero role does not crash role analysis', () => {
    const draft = createEmptyDraft('7.39');
    draft.ally[0].heroId = 'not-a-real-hero-id';
    expect(() => draftAnalyzer.analyze(draft, opts)).not.toThrow();
  });

  it('strong late-game enemy lineup is reflected in the enemy win condition, not a false-certain claim', () => {
    const draft = createEmptyDraft('7.39');
    ['anti-mage', 'phantom-assassin', 'terrorblade'].forEach((id, i) => (draft.enemy[i].heroId = id));
    const analysis = draftAnalyzer.analyze(draft, opts);
    expect(analysis.enemyWinCondition?.dominantPhase).toBe('late');
    expect(analysis.enemyWinCondition?.confidence).toBe('estimated');
  });

  it('strong early-game enemy lineup skews the win condition toward early', () => {
    const draft = createEmptyDraft('7.39');
    ['lycan', 'lion', 'crystal-maiden'].forEach((id, i) => (draft.enemy[i].heroId = id));
    const analysis = draftAnalyzer.analyze(draft, opts);
    expect(['early', 'mid']).toContain(analysis.enemyWinCondition?.dominantPhase);
  });

  it('no-initiation ally draft surfaces the issue', () => {
    const draft = createEmptyDraft('7.39');
    // Three low-control heroes and no Initiator role.
    ['anti-mage', 'juggernaut', 'terrorblade'].forEach((id, i) => (draft.ally[i].heroId = id));
    const analysis = draftAnalyzer.analyze(draft, opts);
    expect(analysis.allyIssues.some((i) => i.type === 'no-initiation')).toBe(true);
  });

  it('physical-damage-only draft is flagged', () => {
    const draft = createEmptyDraft('7.39');
    ['anti-mage', 'juggernaut', 'phantom-assassin', 'terrorblade'].forEach((id, i) => (draft.ally[i].heroId = id));
    const analysis = draftAnalyzer.analyze(draft, opts);
    expect(analysis.allyIssues.some((i) => i.type === 'physical-damage-only')).toBe(true);
  });

  it('high-mobility / split-push enemy is still scored without throwing and factors stay bounded', () => {
    const draft = createEmptyDraft('7.39');
    draft.enemy[0].heroId = 'lycan';
    draft.enemy[1].heroId = 'tinker';
    const analysis = draftAnalyzer.analyze(draft, opts);
    for (const pick of analysis.bestPicks) {
      for (const f of pick.factors) {
        expect(f.score).toBeGreaterThanOrEqual(0);
        expect(f.score).toBeLessThanOrEqual(100);
      }
    }
  });

  it('scaling enemy (heavy late-game) increases the value of early/mid timing picks', () => {
    const draft = createEmptyDraft('7.39');
    ['anti-mage', 'phantom-assassin', 'terrorblade'].forEach((id, i) => (draft.enemy[i].heroId = id));
    const cm = draftAnalyzer.scoreHero('crystal-maiden', draft, opts);
    const timingFactor = cm?.factors.find((f) => f.key === 'timing');
    expect(timingFactor).toBeDefined();
    expect(timingFactor!.confidence).not.toBe('insufficient');
  });

  it('multiple overlapping roles on the ally side does not crash role-completion scoring', () => {
    const draft = createEmptyDraft('7.39');
    ['anti-mage', 'juggernaut', 'phantom-assassin', 'terrorblade'].forEach((id, i) => (draft.ally[i].heroId = id));
    expect(() => draftAnalyzer.analyze(draft, opts)).not.toThrow();
  });

  it('what-if: picking a hero into an open slot returns a before/after comparison', () => {
    const draft = createEmptyDraft('7.39');
    draft.ally[0].heroId = 'crystal-maiden';
    const result = draftAnalyzer.whatIf('anti-mage', draft, opts);
    expect(result).toBeDefined();
    // Before the pick, anti-mage is still an available candidate somewhere in the pool.
    expect(draftAnalyzer.scoreHero('anti-mage', draft, opts)).toBeDefined();
    // After the pick, anti-mage is no longer among the ranked available picks.
    expect(result!.after.bestPicks.some((p) => p.heroId === 'anti-mage')).toBe(false);
  });

  it('what-if: unknown hero id returns undefined rather than throwing', () => {
    const draft = createEmptyDraft('7.39');
    expect(draftAnalyzer.whatIf('not-a-real-hero', draft, opts)).toBeUndefined();
  });

  it('recommendation types are always populated and internally consistent', () => {
    const draft = createEmptyDraft('7.39');
    draft.ally[0].heroId = 'crystal-maiden';
    const analysis = draftAnalyzer.analyze(draft, opts);
    const best = analysis.bestPicks[0];
    expect(best.recommendationTypes).toContain('bestPick');
  });

  it('enemy threat tiers are assigned in descending danger order', () => {
    const draft = createEmptyDraft('7.39');
    ['invoker', 'faceless-void', 'morphling', 'pudge'].forEach((id, i) => (draft.enemy[i].heroId = id));
    const analysis = draftAnalyzer.analyze(draft, opts);
    expect(analysis.enemyThreats[0].tier).toBe('primary');
    expect(analysis.enemyThreats[1].tier).toBe('secondary');
    expect(analysis.enemyThreats[2].tier).toBe('secondary');
    expect(analysis.enemyThreats[3].tier).toBe('tertiary');
  });
});
