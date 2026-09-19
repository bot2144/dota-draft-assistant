import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DraftBoard } from './DraftBoard';
import { BansRow } from './BansRow';
import { BestPicksPanel } from './BestPicksPanel';
import { RecommendedBansPanel } from './RecommendedBansPanel';
import { DraftStatusPanel } from './DraftStatusPanel';
import { WhatShouldIPick } from './WhatShouldIPick';
import { PasteDraftModal } from './PasteDraftModal';
import { useDraftAnalysis } from './useDraftAnalysis';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { WhyBreakdown } from '../../components/WhyBreakdown';
import { useDraftStore } from '../../draft/draftStore';
import { useUIStore } from '../../store/uiStore';
import { getHero } from '../../data/heroes';
import './LiveDraftPage.css';

export function LiveDraftPage() {
  const { t } = useTranslation();
  const { analysis, allyTeam, enemyTeam } = useDraftAnalysis();
  const clearDraft = useDraftStore((s) => s.clearDraft);
  const [pasting, setPasting] = useState(false);
  const whyHeroId = useUIStore((s) => s.whyHeroId);
  const closeWhy = useUIStore((s) => s.closeWhy);

  const whyHero = whyHeroId ? getHero(whyHeroId) : undefined;
  const whyCandidate = whyHero ? analysis.bestPicks.find((p) => p.heroId === whyHero.id) : undefined;

  return (
    <div className="live-draft-page">
      <div className="live-draft-page__toolbar">
        <Button variant="secondary" size="sm" onClick={() => setPasting(true)}>
          {t('draft.pasteDraft')}
        </Button>
        <Button variant="ghost" size="sm" onClick={clearDraft}>
          {t('draft.clearDraft')}
        </Button>
      </div>

      <DraftBoard />
      <BansRow />

      <WhatShouldIPick allyTeam={allyTeam} enemyTeam={enemyTeam} analysis={analysis} />

      <div className="live-draft-page__grid">
        <BestPicksPanel picks={analysis.bestPicks} />
        <DraftStatusPanel analysis={analysis} />
        <RecommendedBansPanel bans={analysis.recommendedBans} />
      </div>

      {pasting && <PasteDraftModal onClose={() => setPasting(false)} />}

      {whyHero && whyCandidate && (
        <Modal title={`${t('draft.why')} — ${whyHero.localizedName}`} onClose={closeWhy} wide>
          <WhyBreakdown hero={whyHero} candidate={whyCandidate} allyTeam={allyTeam} enemyTeam={enemyTeam} />
        </Modal>
      )}
    </div>
  );
}
