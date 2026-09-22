import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Hero } from '../../types/hero';
import type { DraftAnalysis } from '../../types/scoring';
import { getHero } from '../../data/heroes';
import { Button } from '../../components/Button';
import { AIIndicator } from '../../components/AIIndicator';
import { HeroGlyph } from '../../components/HeroBadge';
import { aiService, type AIResult } from '../../ai/AIService';
import { useSettingsStore } from '../../settings/settingsStore';
import { useUIStore } from '../../store/uiStore';
import './WhatShouldIPick.css';

interface Props {
  allyTeam: Hero[];
  enemyTeam: Hero[];
  analysis: DraftAnalysis;
}

export function WhatShouldIPick({ allyTeam, enemyTeam, analysis }: Props) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.settings.language);
  const openWhy = useUIStore((s) => s.openWhy);
  const [result, setResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Instant, no-AI, no-click top pick — the deterministic engine already
  // has this the moment the draft changes, so there's no reason to make
  // the player click a button and wait just to see the single best pick.
  const topPick = analysis.bestPicks[0];
  const topHero = topPick ? getHero(topPick.heroId) : undefined;

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
      {topHero && (
        <button className="what-should-i-pick__instant" onClick={() => openWhy(topHero.id)}>
          <span className="what-should-i-pick__instant-label">{t('draft.instantTopPick')}</span>
          <HeroGlyph hero={topHero} size="sm" />
          <span className="what-should-i-pick__instant-name">{topHero.localizedName}</span>
          <span className="what-should-i-pick__instant-score">{topPick.overallScore}</span>
          <span className="what-should-i-pick__instant-cta">{t('draft.why')} →</span>
        </button>
      )}

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
