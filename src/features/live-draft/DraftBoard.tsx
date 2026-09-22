import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TeamSide } from '../../types/draft';
import { useDraftStore } from '../../draft/draftStore';
import { unavailableHeroIds } from '../../types/draft';
import { getHero } from '../../data/heroes';
import { HeroBadge, EmptySlot } from '../../components/HeroBadge';
import { Modal } from '../../components/Modal';
import { HeroPicker } from '../../components/HeroPicker';
import './DraftBoard.css';

function TeamColumn({ side }: { side: TeamSide }) {
  const { t } = useTranslation();
  const draft = useDraftStore((s) => s.draft);
  const setHero = useDraftStore((s) => s.setHero);
  const [pickingSlot, setPickingSlot] = useState<number | null>(null);

  const slots = draft[side];
  const label = side === 'ally' ? t('draft.yourTeam') : t('draft.enemyTeam');

  return (
    <div className={`team-column team-column--${side}`}>
      <h3 className="team-column__label">{label}</h3>
      <div className="team-column__slots">
        {slots.map((slot, i) => {
          const hero = slot.heroId ? getHero(slot.heroId) : undefined;
          return hero ? (
            <HeroBadge
              key={i}
              hero={hero}
              side={side}
              size="lg"
              subtitle={hero.roles.slice(0, 2).join(' / ')}
              onRemove={() => setHero(side, i, null)}
            />
          ) : (
            <EmptySlot key={i} side={side} onClick={() => setPickingSlot(i)} />
          );
        })}
      </div>

      {pickingSlot !== null && (
        <Modal title={t('draft.addHero')} onClose={() => setPickingSlot(null)}>
          <HeroPicker
            excludeIds={unavailableHeroIds(draft)}
            side={side === 'ally' ? 'ally' : undefined}
            onPick={(heroId) => {
              setHero(side, pickingSlot, heroId);
              setPickingSlot(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

export function DraftBoard() {
  return (
    <div className="draft-board">
      <TeamColumn side="ally" />
      <div className="draft-board__vs">VS</div>
      <TeamColumn side="enemy" />
    </div>
  );
}
