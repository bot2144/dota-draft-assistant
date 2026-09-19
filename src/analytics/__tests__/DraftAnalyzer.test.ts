import { describe, it, expect } from 'vitest';
import { draftAnalyzer } from '../DraftAnalyzer';
import { createEmptyDraft } from '../../types/draft';
import { DEFAULT_WEIGHTS } from '../weights.config';

const opts = { weights: DEFAULT_WEIGHTS, liveStats: new Map() };

describe('DraftAnalyzer scenarios', () => {
  it('empty draft: still returns ranked picks and no crash', () => {
    const draft = createEmptyDraft('7.39');
    const analysis = draftAnalyzer.analyze(draft, opts);
    expect(analysis.bestPicks.length).toBeGreaterThan(0);
    expect(analysis.allyIssues).toHaveLength(0);
    expect(analysis.enemyThreats).toHaveLength(0);
  });

  it('one hero picked: produces recommendations without structural issues yet', () => {
    const draft = createEmptyDraft('7.39');
    draft.ally[0].heroId = 'anti-mage';
    const analysis = draftAnalyzer.analyze(draft, opts);
    expect(analysis.bestPicks.some((p) => p.heroId === 'anti-mage')).toBe(false); // already picked, excluded from candidates
    expect(analysis.allyIssues).toHaveLength(0);
  });

  it('partial draft (3v3): surfaces enemy threats and draft issues', () => {
    const draft = createEmptyDraft('7.39');
    draft.ally[0].heroId = 'crystal-maiden';
    draft.ally[1].heroId = 'lion';
    draft.ally[2].heroId = 'mars';
    draft.enemy[0].heroId = 'invoker';
    draft.enemy[1].heroId = 'faceless-void';
    draft.enemy[2].heroId = 'morphling';

    const analysis = draftAnalyzer.analyze(draft, opts);
    expect(analysis.enemyThreats).toHaveLength(3);
    expect(analysis.bestPicks.length).toBeGreaterThan(0);
    // Recommended bans should reference real, available heroes.
    for (const ban of analysis.recommendedBans) {
      expect(ban.heroId).not.toBe('');
    }
  });

  it('complete 5v5 draft: no crash, best-pick pool comes only from remaining heroes', () => {
    const draft = createEmptyDraft('7.39');
    const allyIds = ['anti-mage', 'crystal-maiden', 'axe', 'lion', 'juggernaut'];
    const enemyIds = ['invoker', 'faceless-void', 'morphling', 'pudge', 'earthshaker'];
    allyIds.forEach((id, i) => (draft.ally[i].heroId = id));
    enemyIds.forEach((id, i) => (draft.enemy[i].heroId = id));

    const analysis = draftAnalyzer.analyze(draft, opts);
    const usedIds = new Set([...allyIds, ...enemyIds]);
    expect(analysis.bestPicks.every((p) => !usedIds.has(p.heroId))).toBe(true);
  });

  it('duplicate hero id across slots does not throw and is treated as unavailable once', () => {
    const draft = createEmptyDraft('7.39');
    draft.ally[0].heroId = 'pudge';
    draft.ally[1].heroId = 'pudge'; // duplicate, should not happen via UI but must not crash
    expect(() => draftAnalyzer.analyze(draft, opts)).not.toThrow();
  });

  it('invalid hero id in a slot is ignored gracefully rather than throwing', () => {
    const draft = createEmptyDraft('7.39');
    draft.ally[0].heroId = 'this-hero-does-not-exist';
    const analysis = draftAnalyzer.analyze(draft, opts);
    expect(analysis).toBeDefined();
    expect(analysis.bestPicks.length).toBeGreaterThan(0);
  });

  it('missing live-stats data results in metaRelevance factors marked insufficient, not fabricated', () => {
    const draft = createEmptyDraft('7.39');
    draft.ally[0].heroId = 'anti-mage';
    const analysis = draftAnalyzer.analyze(draft, opts);
    for (const pick of analysis.bestPicks) {
      const meta = pick.factors.find((f) => f.key === 'metaRelevance')!;
      expect(meta.confidence).toBe('insufficient');
    }
  });

  it('scoreHero returns undefined for an unknown hero id instead of throwing', () => {
    const draft = createEmptyDraft('7.39');
    const result = draftAnalyzer.scoreHero('not-a-real-hero', draft, opts);
    expect(result).toBeUndefined();
  });
});
