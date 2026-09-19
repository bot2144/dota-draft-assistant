import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ALL_HEROES, getHero } from '../../data/heroes';
import { HeroGlyph, HeroBadge } from '../../components/HeroBadge';
import { Panel } from '../../components/Panel';
import { ScoreBar } from '../../components/ScoreBar';
import { synergyEngine } from '../../analytics/SynergyEngine';
import { counterEngine } from '../../analytics/CounterEngine';
import { draftAnalyzer } from '../../analytics/DraftAnalyzer';
import { computeDraftScore } from '../../analytics/DraftScore';
import { roleAnalyzer } from '../../analytics/RoleAnalyzer';
import { useDraftAnalysis } from '../live-draft/useDraftAnalysis';
import { useSettingsStore } from '../../settings/settingsStore';
import { useLiveDataStore } from '../../store/liveDataStore';
import './PickExplorerPage.css';

export function PickExplorerPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { draft, allyTeam, enemyTeam } = useDraftAnalysis();
  const weights = useSettingsStore((s) => s.settings.weights);
  const liveStats = useLiveDataStore((s) => s.liveStats);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_HEROES.filter((h) => !q || h.localizedName.toLowerCase().includes(q)).sort((a, b) =>
      a.localizedName.localeCompare(b.localizedName)
    );
  }, [query]);

  const hero = selectedId ? getHero(selectedId) : undefined;

  const bestAllies = useMemo(() => {
    if (!hero) return [];
    return ALL_HEROES.filter((h) => h.id !== hero.id)
      .map((h) => ({ hero: h, synergy: synergyEngine.pairSynergy(hero, h) }))
      .sort((a, b) => b.synergy.strength - a.synergy.strength)
      .slice(0, 6);
  }, [hero]);

  const worstEnemies = useMemo(() => {
    if (!hero) return [];
    return ALL_HEROES.filter((h) => h.id !== hero.id)
      .map((h) => ({ hero: h, matchup: counterEngine.matchup(h, hero) }))
      .sort((a, b) => b.matchup.advantage - a.matchup.advantage)
      .slice(0, 6);
  }, [hero]);

  const vsEnemyDraft = useMemo(() => {
    if (!hero || enemyTeam.length === 0) return undefined;
    return counterEngine.scoreAgainstTeam(hero, enemyTeam);
  }, [hero, enemyTeam]);

  const draftScore = useMemo(() => {
    if (!hero) return undefined;
    return draftAnalyzer.scoreHero(hero.id, draft, { weights, liveStats });
  }, [hero, draft, weights, liveStats]);

  const openAllySlot = draft.ally.some((s) => !s.heroId);
  const whatIf = useMemo(() => {
    if (!hero || !openAllySlot || allyTeam.some((h) => h.id === hero.id)) return undefined;
    const before = computeDraftScore(allyTeam, roleAnalyzer.analyzeIssues(allyTeam, enemyTeam));
    const nextAlly = [...allyTeam, hero];
    const after = computeDraftScore(nextAlly, roleAnalyzer.analyzeIssues(nextAlly, enemyTeam));
    return { before, after };
  }, [hero, allyTeam, enemyTeam, openAllySlot]);

  return (
    <div className="pick-explorer">
      <div className="pick-explorer__sidebar">
        <input
          className="pick-explorer__search"
          placeholder={t('draft.searchHero') ?? ''}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="pick-explorer__list">
          {filtered.map((h) => (
            <button
              key={h.id}
              className={`pick-explorer__list-item ${h.id === selectedId ? 'pick-explorer__list-item--active' : ''}`}
              onClick={() => setSelectedId(h.id)}
            >
              <HeroGlyph hero={h} size="sm" />
              <span>{h.localizedName}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pick-explorer__content">
        {!hero ? (
          <div className="pick-explorer__placeholder">{t('explorer.selectHero')}</div>
        ) : (
          <>
            <Panel title={t('explorer.profile')}>
              <div className="hero-profile">
                <HeroGlyph hero={hero} size="lg" />
                <div>
                  <h2 className="hero-profile__name">{hero.localizedName}</h2>
                  <p className="hero-profile__meta">
                    {hero.attribute} · {hero.attackType} · {hero.damageType} damage · complexity {hero.complexity}/3
                  </p>
                  <p className="hero-profile__roles">{hero.roles.join(' · ')}</p>
                  {hero.notes && <p className="hero-profile__notes">{hero.notes}</p>}
                </div>
              </div>
              <div className="hero-profile__row">
                <strong>{t('explorer.bestPositions')}:</strong> {hero.positions.map((p) => `Pos ${p}`).join(', ')}
              </div>
            </Panel>

            {draftScore && (
              <Panel title={t('explorer.scoreForCurrentDraft')}>
                <div className="pick-explorer__score">{draftScore.overallScore}</div>
                <div className="pick-explorer__factors">
                  {draftScore.factors.map((f) => (
                    <ScoreBar key={f.key} label={f.key} score={f.score} confidence={f.confidence} compact />
                  ))}
                </div>
              </Panel>
            )}

            {whatIf && (
              <Panel title={t('whatIf.title')}>
                <div className="pick-explorer__what-if">
                  <div>
                    <span className="pick-explorer__what-if-label">{t('whatIf.before')}</span>
                    <span className="pick-explorer__what-if-score">{whatIf.before.score}</span>
                  </div>
                  <span className="pick-explorer__what-if-arrow">→</span>
                  <div>
                    <span className="pick-explorer__what-if-label">{t('whatIf.after')}</span>
                    <span className="pick-explorer__what-if-score">{whatIf.after.score}</span>
                  </div>
                  <div>
                    <span className="pick-explorer__what-if-label">{t('whatIf.difference')}</span>
                    <span
                      className={`pick-explorer__what-if-score ${whatIf.after.score >= whatIf.before.score ? 'pick-explorer__what-if-score--up' : 'pick-explorer__what-if-score--down'}`}
                    >
                      {whatIf.after.score - whatIf.before.score >= 0 ? '+' : ''}
                      {whatIf.after.score - whatIf.before.score}
                    </span>
                  </div>
                </div>
              </Panel>
            )}

            {vsEnemyDraft && (
              <Panel title={t('explorer.vsCurrentEnemyDraft')}>
                <ScoreBar label={t('draft.enemyTeam')} score={vsEnemyDraft.score} confidence={vsEnemyDraft.confidence} />
                <ul className="pick-explorer__reasons">
                  {vsEnemyDraft.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </Panel>
            )}

            <div className="pick-explorer__two-col">
              <Panel title={t('explorer.bestAllies')}>
                <div className="pick-explorer__hero-chips">
                  {bestAllies.map(({ hero: h, synergy }) => (
                    <HeroBadge key={h.id} hero={h} size="sm" subtitle={synergy.reason} />
                  ))}
                </div>
              </Panel>
              <Panel title={t('explorer.worstEnemies')}>
                <div className="pick-explorer__hero-chips">
                  {worstEnemies.map(({ hero: h, matchup }) => (
                    <HeroBadge key={h.id} hero={h} side="enemy" size="sm" subtitle={matchup.reason} />
                  ))}
                </div>
              </Panel>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
