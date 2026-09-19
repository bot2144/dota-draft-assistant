import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Hero } from '../types/hero';
import type { PickCandidate } from '../types/scoring';
import { WEIGHT_LABELS } from '../analytics/weights.config';
import { ScoreBar } from './ScoreBar';
import { AIIndicator } from './AIIndicator';
import { aiService, type AIResult } from '../ai/AIService';
import { useSettingsStore } from '../settings/settingsStore';
import './WhyBreakdown.css';

interface WhyBreakdownProps {
  hero: Hero;
  candidate: PickCandidate;
  allyTeam: Hero[];
  enemyTeam: Hero[];
}

export function WhyBreakdown({ hero, candidate, allyTeam, enemyTeam }: WhyBreakdownProps) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.settings.language);
  const [ai, setAi] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    aiService.explainPick(hero, candidate, allyTeam, enemyTeam, language).then((res) => {
      if (!cancelled) {
        setAi(res);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero.id, candidate.overallScore]);

  return (
    <div className="why-breakdown">
      <div className="why-breakdown__factors">
        {candidate.factors.map((f) => (
          <ScoreBar key={f.key} label={WEIGHT_LABELS[f.key]} score={f.score} confidence={f.confidence} />
        ))}
      </div>

      <div className="why-breakdown__ai">
        <AIIndicator usedAI={!!ai?.usedAI} loading={loading} errorKind={ai?.errorKind} />
        <div className="why-breakdown__ai-text">{loading ? '…' : ai?.text}</div>
      </div>

      <div className="why-breakdown__lists">
        <div>
          <h4>{t('draft.strengths')}</h4>
          <ul>
            {candidate.strengths.length ? candidate.strengths.map((s, i) => <li key={i}>{s}</li>) : <li className="why-breakdown__muted">—</li>}
          </ul>
        </div>
        <div>
          <h4>{t('draft.risks')}</h4>
          <ul>
            {candidate.risks.length ? candidate.risks.map((r, i) => <li key={i}>{r}</li>) : <li className="why-breakdown__muted">—</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
