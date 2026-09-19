import { useTranslation } from 'react-i18next';
import type { PickCandidate } from '../../types/scoring';
import { getHero } from '../../data/heroes';
import { HeroGlyph } from '../../components/HeroBadge';
import { Panel } from '../../components/Panel';
import { Button } from '../../components/Button';
import { useUIStore } from '../../store/uiStore';
import './BestPicksPanel.css';

export function BestPicksPanel({ picks }: { picks: PickCandidate[] }) {
  const { t } = useTranslation();
  const openWhy = useUIStore((s) => s.openWhy);

  return (
    <Panel title={t('draft.bestPicks')}>
      <ol className="best-picks">
        {picks.slice(0, 6).map((p, i) => {
          const hero = getHero(p.heroId);
          if (!hero) return null;
          return (
            <li key={p.heroId} className="best-picks__row">
              <span className="best-picks__rank">{i + 1}</span>
              <HeroGlyph hero={hero} size="sm" />
              <span className="best-picks__name">{hero.localizedName}</span>
              {p.recommendationTypes.length > 0 && (
                <span className="best-picks__badges">
                  {p.recommendationTypes.map((rt) => (
                    <span key={rt} className={`best-picks__badge best-picks__badge--${rt}`}>
                      {t(`recommendation.${rt}`)}
                    </span>
                  ))}
                </span>
              )}
              <span className="best-picks__score">{p.overallScore}</span>
              <Button variant="ghost" size="sm" onClick={() => openWhy(hero.id)}>
                {t('draft.why')}
              </Button>
            </li>
          );
        })}
        {picks.length === 0 && <p className="best-picks__empty">—</p>}
      </ol>
    </Panel>
  );
}
