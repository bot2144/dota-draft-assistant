import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel } from '../../components/Panel';
import { Button } from '../../components/Button';
import { useDraftAnalysis } from '../live-draft/useDraftAnalysis';
import { useDraftStore } from '../../draft/draftStore';
import { useUIStore } from '../../store/uiStore';
import { getHero } from '../../data/heroes';
import { HeroGlyph } from '../../components/HeroBadge';
import {
  saveDraftHistory,
  listDraftHistory,
  deleteDraftHistory,
  type DraftHistoryEntry,
} from '../../data/historyStore';
import './HistoryPage.css';

export function HistoryPage() {
  const { t } = useTranslation();
  const { draft, analysis } = useDraftAnalysis();
  const loadHeroIds = useDraftStore((s) => s.loadHeroIds);
  const setView = useUIStore((s) => s.setView);
  const [entries, setEntries] = useState<DraftHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listDraftHistory().then((list) => {
      if (!cancelled) {
        setEntries(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  function refresh() {
    setLoading(true);
    setRefreshToken((n) => n + 1);
  }

  async function handleSave() {
    setSaving(true);
    const allyHeroes = draft.ally.map((s) => s.heroId).filter((id): id is string => !!id);
    const enemyHeroes = draft.enemy.map((s) => s.heroId).filter((id): id is string => !!id);
    await saveDraftHistory({ patch: draft.patch, allyHeroes, enemyHeroes, analysisSnapshot: analysis });
    setSaving(false);
    refresh();
  }

  async function handleDelete(id: string) {
    await deleteDraftHistory(id);
    refresh();
  }

  function handleReopen(entry: DraftHistoryEntry) {
    loadHeroIds(entry.allyHeroes, entry.enemyHeroes, entry.patch);
    setView('live-draft');
  }

  const hasCurrentDraft = draft.ally.some((s) => s.heroId) || draft.enemy.some((s) => s.heroId);

  return (
    <div className="history-page">
      <Panel title={t('history.title')}>
        <p className="history-page__hint">{t('history.hint')}</p>
        <Button onClick={handleSave} disabled={!hasCurrentDraft || saving}>
          {saving ? t('common.loading') : t('history.saveCurrent')}
        </Button>
      </Panel>

      <Panel title={t('history.savedDrafts')}>
        {loading && <div className="history-page__empty">{t('common.loading')}</div>}
        {!loading && entries.length === 0 && <div className="history-page__empty">{t('history.empty')}</div>}
        <div className="history-page__list">
          {entries.map((entry) => (
            <div key={entry.id} className="history-entry">
              <div className="history-entry__meta">
                <span className="history-entry__date">{new Date(entry.createdAt).toLocaleString()}</span>
                <span className="history-entry__patch">{entry.patch}</span>
              </div>
              <div className="history-entry__teams">
                <div className="history-entry__team">
                  {entry.allyHeroes.map((id) => {
                    const hero = getHero(id);
                    return hero ? <HeroGlyph key={id} hero={hero} size="sm" /> : null;
                  })}
                </div>
                <span className="history-entry__vs">vs</span>
                <div className="history-entry__team">
                  {entry.enemyHeroes.map((id) => {
                    const hero = getHero(id);
                    return hero ? <HeroGlyph key={id} hero={hero} size="sm" /> : null;
                  })}
                </div>
              </div>
              <div className="history-entry__actions">
                <Button variant="secondary" size="sm" onClick={() => handleReopen(entry)}>
                  {t('history.reopen')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)}>
                  {t('history.delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
