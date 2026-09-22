import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ALL_HEROES } from '../data/heroes';
import { HeroGlyph } from './HeroBadge';
import { useDraftStore } from '../draft/draftStore';
import { useSettingsStore } from '../settings/settingsStore';
import { useLiveDataStore } from '../store/liveDataStore';
import { draftAnalyzer } from '../analytics/DraftAnalyzer';
import type { Position } from '../types/hero';
import type { TeamSide } from '../types/draft';
import './HeroPicker.css';

interface HeroPickerProps {
  excludeIds: Set<string>;
  onPick: (heroId: string) => void;
  /**
   * When provided, the picker also scores every remaining hero against the
   * current draft (same engine as Live Draft's Best Picks) and, with no
   * search text, sorts by that score — so the best-fitting heroes for this
   * side show up first instead of requiring a trip to Best Picks first.
   */
  side?: TeamSide;
}

const POSITIONS: Position[] = [1, 2, 3, 4, 5];

export function HeroPicker({ excludeIds, onPick, side }: HeroPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<Position | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const draft = useDraftStore((s) => s.draft);
  const weights = useSettingsStore((s) => s.settings.weights);
  const liveStats = useLiveDataStore((s) => s.liveStats);

  // Score every remaining hero against the current draft (fast, synchronous,
  // fully local) so the list can default to "best fit first" — a passive
  // hint the player sees just by opening the picker, no extra click needed.
  const scores = useMemo(() => {
    if (!side) return undefined;
    const map = new Map<string, number>();
    for (const h of ALL_HEROES) {
      if (excludeIds.has(h.id)) continue;
      const candidate = draftAnalyzer.scoreHero(h.id, draft, { weights, liveStats });
      if (candidate) map.set(h.id, candidate.overallScore);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side, draft, weights, liveStats, excludeIds.size]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = ALL_HEROES.filter((h) => !excludeIds.has(h.id));
    if (positionFilter) list = list.filter((h) => (h.positions as number[]).includes(positionFilter));
    list = list.filter((h) => !q || h.localizedName.toLowerCase().includes(q));

    if (scores && !q) {
      list = [...list].sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
    } else {
      list = [...list].sort((a, b) => a.localizedName.localeCompare(b.localizedName));
    }
    return list;
  }, [query, excludeIds, positionFilter, scores]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && results[0]) {
      onPick(results[0].id);
    }
  }

  return (
    <div className="hero-picker">
      <input
        ref={inputRef}
        autoFocus
        className="hero-picker__search"
        placeholder={t('draft.searchHero') ?? 'Search hero...'}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className="hero-picker__positions">
        <button
          className={`hero-picker__pos ${positionFilter === null ? 'hero-picker__pos--active' : ''}`}
          onClick={() => setPositionFilter(null)}
        >
          {t('draft.allPositions')}
        </button>
        {POSITIONS.map((p) => (
          <button
            key={p}
            className={`hero-picker__pos ${positionFilter === p ? 'hero-picker__pos--active' : ''}`}
            onClick={() => setPositionFilter(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {scores && !query.trim() && (
        <p className="hero-picker__hint">{t('draft.sortedByFit')}</p>
      )}

      <div className="hero-picker__grid">
        {results.map((h) => {
          const score = scores?.get(h.id);
          return (
            <button key={h.id} className="hero-picker__item" onClick={() => onPick(h.id)}>
              {score !== undefined && <span className="hero-picker__item-score">{score}</span>}
              <HeroGlyph hero={h} size="md" />
              <span>{h.localizedName}</span>
            </button>
          );
        })}
        {results.length === 0 && <p className="hero-picker__empty">No heroes match "{query}"</p>}
      </div>
    </div>
  );
}
