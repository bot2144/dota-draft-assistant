import type { Hero } from '../types/hero';
import './HeroBadge.css';

const ATTRIBUTE_GRADIENT: Record<Hero['attribute'], string> = {
  STR: 'linear-gradient(135deg, #ff6b6b, #b3352f)',
  AGI: 'linear-gradient(135deg, #4ade80, #1f7a4d)',
  INT: 'linear-gradient(135deg, #5aa7ff, #274b9e)',
  UNIVERSAL: 'linear-gradient(135deg, #f0c14b, #a8791d)',
};

function initials(name: string): string {
  return name
    .split(/[\s'-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

interface HeroGlyphProps {
  hero: Hero;
  size?: 'sm' | 'md' | 'lg';
}

/** Stylized hero glyph — a deterministic colored badge, not real Dota 2 artwork. */
export function HeroGlyph({ hero, size = 'md' }: HeroGlyphProps) {
  return (
    <div
      className={`hero-glyph hero-glyph--${size}`}
      style={{ background: ATTRIBUTE_GRADIENT[hero.attribute] }}
      title={hero.localizedName}
    >
      {initials(hero.localizedName)}
    </div>
  );
}

interface HeroBadgeProps {
  hero: Hero;
  side?: 'ally' | 'enemy' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  onRemove?: () => void;
  subtitle?: string;
  selected?: boolean;
}

export function HeroBadge({ hero, side = 'neutral', size = 'md', onClick, onRemove, subtitle, selected }: HeroBadgeProps) {
  return (
    <div
      className={`hero-badge hero-badge--${side} hero-badge--${size} ${selected ? 'hero-badge--selected' : ''} ${onClick ? 'hero-badge--clickable' : ''}`}
      onClick={onClick}
    >
      <HeroGlyph hero={hero} size={size} />
      <div className="hero-badge__text">
        <span className="hero-badge__name">{hero.localizedName}</span>
        {subtitle && <span className="hero-badge__subtitle">{subtitle}</span>}
      </div>
      {onRemove && (
        <button
          className="hero-badge__remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${hero.localizedName}`}
        >
          ×
        </button>
      )}
    </div>
  );
}

export function EmptySlot({ side, onClick }: { side: 'ally' | 'enemy'; onClick?: () => void }) {
  return (
    <button className={`empty-slot empty-slot--${side}`} onClick={onClick}>
      <span className="empty-slot__plus">+</span>
    </button>
  );
}
