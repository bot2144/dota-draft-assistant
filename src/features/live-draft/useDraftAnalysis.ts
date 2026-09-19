import { useMemo } from 'react';
import { useDraftStore } from '../../draft/draftStore';
import { useSettingsStore } from '../../settings/settingsStore';
import { useLiveDataStore } from '../../store/liveDataStore';
import { draftAnalyzer } from '../../analytics/DraftAnalyzer';
import { getHero } from '../../data/heroes';
import type { Hero } from '../../types/hero';

export function useDraftAnalysis(topN = 8) {
  const draft = useDraftStore((s) => s.draft);
  const weights = useSettingsStore((s) => s.settings.weights);
  const liveStats = useLiveDataStore((s) => s.liveStats);

  const analysis = useMemo(
    () => draftAnalyzer.analyze(draft, { weights, liveStats, topN }),
    [draft, weights, liveStats, topN]
  );

  const allyTeam: Hero[] = useMemo(
    () => draft.ally.map((s) => (s.heroId ? getHero(s.heroId) : undefined)).filter((h): h is Hero => !!h),
    [draft.ally]
  );
  const enemyTeam: Hero[] = useMemo(
    () => draft.enemy.map((s) => (s.heroId ? getHero(s.heroId) : undefined)).filter((h): h is Hero => !!h),
    [draft.enemy]
  );

  return { draft, analysis, allyTeam, enemyTeam };
}
