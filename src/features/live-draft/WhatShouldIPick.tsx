import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Hero } from '../../types/hero';
import type { DraftAnalysis } from '../../types/scoring';
import { getHero } from '../../data/heroes';
import { Button } from '../../components/Button';
import { AIIndicator } from '../../components/AIIndicator';
import { aiService, type AIResult } from '../../ai/AIService';
import { useSettingsStore } from '../../settings/settingsStore';
import './WhatShouldIPick.css';

interface Props {
  allyTeam: Hero[];
  enemyTeam: Hero[];
  analysis: DraftAnalysis;
}

export function WhatShouldIPick({ allyTeam, enemyTeam, analysis }: Props) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.settings.language);
  const [result, setResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const top = analysis.bestPicks
      .slice(0, 5)
      .map((candidate) => ({ hero: getHero(candidate.heroId)!, candidate }))
      .filter((e) => e.hero);
    const res = await aiService.whatShouldIPick(allyTeam, enemyTeam, top, analysis, language);
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="what-should-i-pick">
      <Button variant="primary" size="lg" onClick={handleClick} disabled={loading}>
        {t('draft.whatShouldIPick')}
      </Button>

      {(loading || result) && (
        <div className="what-should-i-pick__result">
          <AIIndicator usedAI={!!result?.usedAI} loading={loading} errorKind={result?.errorKind} />
          <div className="what-should-i-pick__text">{loading ? '…' : result?.text}</div>
        </div>
      )}
    </div>
  );
}
