import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getHero } from '../../data/heroes';
import { draftAnalyzer } from '../../analytics/DraftAnalyzer';
import { WEIGHT_LABELS } from '../../analytics/weights.config';
import { useDraftAnalysis } from '../live-draft/useDraftAnalysis';
import { useSettingsStore } from '../../settings/settingsStore';
import { useLiveDataStore } from '../../store/liveDataStore';
import { Panel } from '../../components/Panel';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { HeroPicker } from '../../components/HeroPicker';
import { HeroGlyph } from '../../components/HeroBadge';
import { AIIndicator } from '../../components/AIIndicator';
import { aiService, type AIResult } from '../../ai/AIService';
import type { PickCandidate, ScoreFactorKey } from '../../types/scoring';
import type { Hero } from '../../types/hero';
import './ComparePage.css';

const FACTOR_KEYS: ScoreFactorKey[] = [
  'counter',
  'synergy',
  'roleCompletion',
  'laneCompatibility',
  'teamfightSynergy',
  'enemyThreatResponse',
  'metaRelevance',
  'flexibility',
  'scaling',
  'timing',
  'executionFit',
  'draftBalance',
];

export function ComparePage() {
  const { t } = useTranslation();
  const { draft, allyTeam, enemyTeam } = useDraftAnalysis();
  const weights = useSettingsStore((s) => s.settings.weights);
  const language = useSettingsStore((s) => s.settings.language);
  const liveStats = useLiveDataStore((s) => s.liveStats);
  const [selected, setSelected] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  const [ai, setAi] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);

  const entries = useMemo(
    () =>
      selected
        .map((id) => {
          const hero = getHero(id);
          const candidate = draftAnalyzer.scoreHero(id, draft, { weights, liveStats });
          return hero && candidate ? { hero, candidate } : undefined;
        })
        .filter((e): e is { hero: Hero; candidate: PickCandidate } => !!e),
    [selected, draft, weights, liveStats]
  );

  useEffect(() => {
    if (entries.length < 2) {
      setAi(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    aiService.compareHeroes(entries, allyTeam, enemyTeam, language).then((res) => {
      if (!cancelled) {
        setAi(res);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.map((e) => e.hero.id).join(',')]);

  return (
    <div className="compare-page">
      <div className="compare-page__toolbar">
        <Button variant="secondary" size="sm" onClick={() => setPicking(true)} disabled={selected.length >= 3}>
          {t('compare.addToCompare')}
        </Button>
        {selected.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
            {t('compare.removeAll')}
          </Button>
        )}
      </div>

      <div className="compare-page__heroes">
        {entries.map(({ hero }) => (
          <div key={hero.id} className="compare-page__hero-chip">
            <HeroGlyph hero={hero} size="md" />
            <span>{hero.localizedName}</span>
            <button onClick={() => setSelected((s) => s.filter((id) => id !== hero.id))}>×</button>
          </div>
        ))}
      </div>

      {entries.length >= 2 && (
        <>
          <Panel title={t('compare.title')}>
            <table className="compare-table">
              <thead>
                <tr>
                  <th></th>
                  {entries.map(({ hero }) => (
                    <th key={hero.id}>{hero.localizedName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FACTOR_KEYS.map((key) => (
                  <tr key={key}>
                    <td className="compare-table__label">{WEIGHT_LABELS[key]}</td>
                    {entries.map(({ hero, candidate }) => {
                      const factor = candidate.factors.find((f) => f.key === key)!;
                      return (
                        <td key={hero.id} className="compare-table__cell">
                          {Math.round(factor.score)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="compare-table__overall">
                  <td className="compare-table__label">{t('common.score')}</td>
                  {entries.map(({ hero, candidate }) => (
                    <td key={hero.id} className="compare-table__cell">
                      {candidate.overallScore}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </Panel>

          <Panel title="AI">
            <AIIndicator usedAI={!!ai?.usedAI} loading={loading} errorKind={ai?.errorKind} />
            <div className="compare-page__ai-text">{loading ? '…' : ai?.text}</div>
          </Panel>
        </>
      )}

      {picking && (
        <Modal title={t('compare.addToCompare')} onClose={() => setPicking(false)}>
          <HeroPicker
            excludeIds={new Set(selected)}
            onPick={(id) => {
              setSelected((s) => [...s, id].slice(0, 3));
              setPicking(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
