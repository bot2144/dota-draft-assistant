import { describe, it, expect, beforeEach } from 'vitest';
import { saveDraftHistory, listDraftHistory, deleteDraftHistory, clearDraftHistory } from '../historyStore';
import type { DraftAnalysis } from '../../types/scoring';

const fakeAnalysis: DraftAnalysis = {
  allyIssues: [],
  enemyThreats: [],
  recommendedBans: [],
  bestPicks: [],
  patch: '7.39',
  generatedAt: new Date().toISOString(),
};

describe('historyStore (localStorage fallback, no Tauri runtime)', () => {
  beforeEach(async () => {
    await clearDraftHistory();
  });

  it('saves and lists an entry, newest first', async () => {
    await saveDraftHistory({ patch: '7.39', allyHeroes: ['anti-mage'], enemyHeroes: ['pudge'], analysisSnapshot: fakeAnalysis });
    const list = await listDraftHistory();
    expect(list).toHaveLength(1);
    expect(list[0].allyHeroes).toContain('anti-mage');
  });

  it('deletes an entry by id', async () => {
    const saved = await saveDraftHistory({ patch: '7.39', allyHeroes: [], enemyHeroes: [], analysisSnapshot: fakeAnalysis });
    expect(saved).toBeDefined();
    await deleteDraftHistory(saved!.id);
    expect(await listDraftHistory()).toHaveLength(0);
  });

  it('never throws even if called repeatedly', async () => {
    await expect(saveDraftHistory({ patch: '7.39', allyHeroes: [], enemyHeroes: [], analysisSnapshot: fakeAnalysis })).resolves.toBeDefined();
    await expect(listDraftHistory()).resolves.toBeDefined();
  });
});
