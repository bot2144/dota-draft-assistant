import { create } from 'zustand';

export type ViewId = 'live-draft' | 'explorer' | 'simulator' | 'compare' | 'history' | 'settings';

interface UIStoreState {
  view: ViewId;
  setView: (v: ViewId) => void;
  whyHeroId: string | null;
  openWhy: (heroId: string) => void;
  closeWhy: () => void;
  overlayVisible: boolean;
  toggleOverlay: () => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  view: 'live-draft',
  setView: (v) => set({ view: v }),
  whyHeroId: null,
  openWhy: (heroId) => set({ whyHeroId: heroId }),
  closeWhy: () => set({ whyHeroId: null }),
  overlayVisible: true,
  toggleOverlay: () => set((s) => ({ overlayVisible: !s.overlayVisible })),
}));
