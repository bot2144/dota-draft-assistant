import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDraftStore } from '../../draft/draftStore';
import { unavailableHeroIds } from '../../types/draft';
import { getHero } from '../../data/heroes';
import { HeroGlyph } from '../../components/HeroBadge';
import { Modal } from '../../components/Modal';
import { HeroPicker } from '../../components/HeroPicker';
import './BansRow.css';

export function BansRow() {
  const { t } = useTranslation();
  const draft = useDraftStore((s) => s.draft);
  const toggleBan = useDraftStore((s) => s.toggleBan);
  const [picking, setPicking] = useState<'ally' | 'enemy' | null>(null);

  const renderList = (side: 'ally' | 'enemy') => {
    const ids = side === 'ally' ? draft.allyBans : draft.enemyBans;
    return (
      <div className={`bans-row__list bans-row__list--${side}`}>
        {ids.map((id) => {
          const hero = getHero(id);
          if (!hero) return null;
          return (
            <button key={id} className="bans-row__chip" onClick={() => toggleBan(side, id)} title="Click to remove">
              <HeroGlyph hero={hero} size="sm" />
            </button>
          );
        })}
        <button className="bans-row__add" onClick={() => setPicking(side)}>
          +
        </button>
      </div>
    );
  };

  return (
    <div className="bans-row">
      <div className="bans-row__side">
        <span className="bans-row__label">{t('draft.bans')}</span>
        {renderList('ally')}
      </div>
      <div className="bans-row__side bans-row__side--right">
        {renderList('enemy')}
        <span className="bans-row__label">{t('draft.bans')}</span>
      </div>

      {picking && (
        <Modal title={t('draft.bans')} onClose={() => setPicking(null)}>
          <HeroPicker
            excludeIds={unavailableHeroIds(draft)}
            onPick={(heroId) => {
              toggleBan(picking, heroId);
              setPicking(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
