import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DraftBoard } from '../live-draft/DraftBoard';
import { useDraftAnalysis } from '../live-draft/useDraftAnalysis';
import { computeDraftScore } from '../../analytics/DraftScore';
import { Panel } from '../../components/Panel';
import { AIIndicator } from '../../components/AIIndicator';
import { aiService, type AIResult } from '../../ai/AIService';
import { useSettingsStore } from '../../settings/settingsStore';
import './SimulatorPage.css';

export function SimulatorPage() {
  const { t } = useTranslation();
  const { analysis, allyTeam, enemyTeam } = useDraftAnalysis();
  const language = useSettingsStore((s) => s.settings.language);
  const draftScore = computeDraftScore(allyTeam, analysis.allyIssues);
  const [summary, setSummary] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (allyTeam.length === 0) {
      setSummary(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    aiService.scheduleDebounced('simulator-summary', () => {
      aiService.summarizeDraft(allyTeam, enemyTeam, analysis, language).then((res) => {
        if (!cancelled) {
          setSummary(res);
          setLoading(false);
        }
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allyTeam.map((h) => h.id).join(','), enemyTeam.map((h) => h.id).join(',')]);

  const powerCurveLine = `Early ${draftScore.powerCurve.early} · Mid ${draftScore.powerCurve.mid} · Late ${draftScore.powerCurve.late} · Flexible ${draftScore.powerCurve.flexible}`;

  return (
    <div className="simulator-page">
      <DraftBoard />

      <div className="simulator-page__grid">
        <Panel title={t('simulator.draftScore')}>
          <div className="simulator-page__score">{draftScore.score}</div>
          <p className="simulator-page__power-curve">{powerCurveLine}</p>
        </Panel>

        <Panel title={t('simulator.majorThreats')}>
          <ul className="simulator-page__list">
            {analysis.enemyThreats.length === 0 && <li className="simulator-page__muted">—</li>}
            {analysis.enemyThreats.map((th) => (
              <li key={th.heroId}>
                {th.heroId} — {Math.round(th.threatLevel)}: {th.reason}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={`${t('simulator.weaknesses')} / ${t('simulator.recommendedChanges')}`} className="simulator-page__wide">
          <AIIndicator usedAI={!!summary?.usedAI} loading={loading} errorKind={summary?.errorKind} />
          <div className="simulator-page__summary">{loading ? '…' : summary?.text ?? '—'}</div>
        </Panel>
      </div>
    </div>
  );
}
