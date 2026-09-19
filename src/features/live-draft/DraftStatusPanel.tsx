import { useTranslation } from 'react-i18next';
import type { DraftAnalysis } from '../../types/scoring';
import { getHero } from '../../data/heroes';
import { Panel } from '../../components/Panel';
import './DraftStatusPanel.css';

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

export function DraftStatusPanel({ analysis }: { analysis: DraftAnalysis }) {
  const { t } = useTranslation();
  const issues = [...analysis.allyIssues].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return (
    <Panel title={t('draft.draftIssues')}>
      {issues.length === 0 ? (
        <p className="draft-status__empty">{t('draft.noAllyPicks')}</p>
      ) : (
        <ul className="draft-status__list">
          {issues.map((issue, i) => (
            <li key={i} className={`draft-status__item draft-status__item--${issue.severity}`}>
              <span className="draft-status__dot" />
              {issue.message}
            </li>
          ))}
        </ul>
      )}

      <h4 className="draft-status__subheading">{t('draft.enemyThreats')}</h4>
      {analysis.enemyThreats.length === 0 ? (
        <p className="draft-status__empty">{t('draft.noEnemyPicks')}</p>
      ) : (
        <ul className="draft-status__list">
          {analysis.enemyThreats.map((threat) => {
            const hero = getHero(threat.heroId);
            if (!hero) return null;
            return (
              <li key={threat.heroId} className={`draft-status__threat draft-status__threat--${threat.tier}`}>
                <span className={`draft-status__threat-tier draft-status__threat-tier--${threat.tier}`}>
                  {t(`threatTier.${threat.tier}`)}
                </span>
                <span className="draft-status__threat-name">{hero.localizedName}</span>
                <span className="draft-status__threat-level">{Math.round(threat.threatLevel)}</span>
                <span className="draft-status__threat-reason">{threat.reason}</span>
              </li>
            );
          })}
        </ul>
      )}

      {(analysis.allyWinCondition || analysis.enemyWinCondition) && (
        <>
          <h4 className="draft-status__subheading">{t('winCondition.title')}</h4>
          <div className="draft-status__win-conditions">
            {analysis.allyWinCondition && (
              <div className="draft-status__win-condition">
                <span className="draft-status__win-condition-label">{t('winCondition.ally')}</span>
                <span className="draft-status__win-condition-text">{analysis.allyWinCondition.description}</span>
              </div>
            )}
            {analysis.enemyWinCondition && (
              <div className="draft-status__win-condition">
                <span className="draft-status__win-condition-label">{t('winCondition.enemy')}</span>
                <span className="draft-status__win-condition-text">{analysis.enemyWinCondition.description}</span>
              </div>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}
