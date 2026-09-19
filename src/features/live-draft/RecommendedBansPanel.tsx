import { useTranslation } from 'react-i18next';
import type { DraftAnalysis } from '../../types/scoring';
import { getHero } from '../../data/heroes';
import { HeroGlyph } from '../../components/HeroBadge';
import { Panel } from '../../components/Panel';
import './RecommendedBansPanel.css';

export function RecommendedBansPanel({ bans }: { bans: DraftAnalysis['recommendedBans'] }) {
  const { t } = useTranslation();
  return (
    <Panel title={t('draft.recommendedBans')}>
      <ul className="recommended-bans">
        {bans.map((b) => {
          const hero = getHero(b.heroId);
          if (!hero) return null;
          return (
            <li key={b.heroId} className="recommended-bans__row">
              <HeroGlyph hero={hero} size="sm" />
              <div className="recommended-bans__text">
                <span className="recommended-bans__name">{hero.localizedName}</span>
                <span className="recommended-bans__reason">{b.reason}</span>
              </div>
              <span className="recommended-bans__score">{b.score}</span>
            </li>
          );
        })}
        {bans.length === 0 && <p className="recommended-bans__empty">—</p>}
      </ul>
    </Panel>
  );
}
