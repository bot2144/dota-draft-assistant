import type { Position } from './hero';

export type TeamSide = 'ally' | 'enemy';

/** A draft slot: an empty pick, or a locked-in hero, with optional intended position. */
export interface DraftSlot {
  heroId: string | null;
  position?: Position;
}

export interface DraftState {
  ally: DraftSlot[]; // length 5
  enemy: DraftSlot[]; // length 5
  allyBans: string[];
  enemyBans: string[];
  /** Heroes unavailable this game for any reason (banned by either side, or already picked). */
  patch: string;
}

export const EMPTY_SLOTS = (): DraftSlot[] =>
  Array.from({ length: 5 }, () => ({ heroId: null }));

export function createEmptyDraft(patch: string): DraftState {
  return {
    ally: EMPTY_SLOTS(),
    enemy: EMPTY_SLOTS(),
    allyBans: [],
    enemyBans: [],
    patch,
  };
}

export function pickedHeroIds(draft: DraftState): string[] {
  return [...draft.ally, ...draft.enemy]
    .map((s) => s.heroId)
    .filter((id): id is string => !!id);
}

export function unavailableHeroIds(draft: DraftState): Set<string> {
  return new Set([
    ...pickedHeroIds(draft),
    ...draft.allyBans,
    ...draft.enemyBans,
  ]);
}
