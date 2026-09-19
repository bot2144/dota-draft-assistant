import { create } from 'zustand';
import type { DraftState, TeamSide } from '../types/draft';
import { createEmptyDraft } from '../types/draft';
import { parseDraftPaste } from './pasteParser';
import { PatchManager } from '../patch/PatchManager';

interface DraftStoreState {
  draft: DraftState;
  setHero: (side: TeamSide, slotIndex: number, heroId: string | null) => void;
  addHero: (side: TeamSide, heroId: string) => void;
  removeHero: (side: TeamSide, heroId: string) => void;
  toggleBan: (side: TeamSide, heroId: string) => void;
  clearDraft: () => void;
  loadFromPaste: (text: string) => { unmatched: string[] };
  loadHeroIds: (allyIds: string[], enemyIds: string[], patch?: string) => void;
  setPatch: (patch: string) => void;
}

export const useDraftStore = create<DraftStoreState>((set, get) => ({
  draft: createEmptyDraft(PatchManager.bundled().id),

  setHero: (side, slotIndex, heroId) =>
    set((state) => {
      const slots = [...state.draft[side]];
      slots[slotIndex] = { ...slots[slotIndex], heroId };
      return { draft: { ...state.draft, [side]: slots } };
    }),

  addHero: (side, heroId) =>
    set((state) => {
      const slots = [...state.draft[side]];
      const emptyIndex = slots.findIndex((s) => s.heroId === null);
      if (emptyIndex === -1) return state; // team full
      slots[emptyIndex] = { ...slots[emptyIndex], heroId };
      return { draft: { ...state.draft, [side]: slots } };
    }),

  removeHero: (side, heroId) =>
    set((state) => {
      const slots = state.draft[side].map((s) => (s.heroId === heroId ? { ...s, heroId: null } : s));
      return { draft: { ...state.draft, [side]: slots } };
    }),

  toggleBan: (side, heroId) =>
    set((state) => {
      const key = side === 'ally' ? 'allyBans' : 'enemyBans';
      const list = state.draft[key];
      const next = list.includes(heroId) ? list.filter((id) => id !== heroId) : [...list, heroId];
      return { draft: { ...state.draft, [key]: next } };
    }),

  clearDraft: () => set({ draft: createEmptyDraft(get().draft.patch) }),

  loadFromPaste: (text) => {
    const parsed = parseDraftPaste(text);
    set((state) => ({
      draft: {
        ...state.draft,
        ally: Array.from({ length: 5 }, (_, i) => ({ heroId: parsed.ally[i] ?? null })),
        enemy: Array.from({ length: 5 }, (_, i) => ({ heroId: parsed.enemy[i] ?? null })),
      },
    }));
    return { unmatched: parsed.unmatched };
  },

  loadHeroIds: (allyIds, enemyIds, patch) =>
    set((state) => ({
      draft: {
        ...state.draft,
        patch: patch ?? state.draft.patch,
        ally: Array.from({ length: 5 }, (_, i) => ({ heroId: allyIds[i] ?? null })),
        enemy: Array.from({ length: 5 }, (_, i) => ({ heroId: enemyIds[i] ?? null })),
      },
    })),

  setPatch: (patch) => set((state) => ({ draft: { ...state.draft, patch } })),
}));
