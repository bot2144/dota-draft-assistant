import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ALL_HEROES } from '../data/heroes';
import { HeroGlyph } from './HeroBadge';
import './HeroPicker.css';

interface HeroPickerProps {
  excludeIds: Set<string>;
  onPick: (heroId: string) => void;
}

export function HeroPicker({ excludeIds, onPick }: HeroPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_HEROES.filter((h) => !excludeIds.has(h.id))
      .filter((h) => !q || h.localizedName.toLowerCase().includes(q))
      .sort((a, b) => a.localizedName.localeCompare(b.localizedName));
  }, [query, excludeIds]);

  return (
    <div className="hero-picker">
      <input
        autoFocus
        className="hero-picker__search"
        placeholder={t('draft.searchHero') ?? 'Search hero...'}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="hero-picker__grid">
        {results.map((h) => (
          <button key={h.id} className="hero-picker__item" onClick={() => onPick(h.id)}>
            <HeroGlyph hero={h} size="md" />
            <span>{h.localizedName}</span>
          </button>
        ))}
        {results.length === 0 && <p className="hero-picker__empty">No heroes match "{query}"</p>}
      </div>
    </div>
  );
}
