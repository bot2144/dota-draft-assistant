import { create } from 'zustand';

export interface GsiStatus {
  running: boolean;
  lastPayloadAt: number | null;
  detectedSide: 'radiant' | 'dire' | null;
  unmappedHeroes: string[];
  error: string | null;
}

interface GsiStatusStore {
  status: GsiStatus;
  set: (patch: Partial<GsiStatus>) => void;
  addUnmapped: (names: string[]) => void;
}

const initial: GsiStatus = {
  running: false,
  lastPayloadAt: null,
  detectedSide: null,
  unmappedHeroes: [],
  error: null,
};

/** Shared GSI connection status — written by useGsiIntegration (mounted once in App), read anywhere (e.g. the Settings panel) without starting a second listener. */
export const useGsiStatusStore = create<GsiStatusStore>((set, get) => ({
  status: initial,
  set: (patch) => set((s) => ({ status: { ...s.status, ...patch } })),
  addUnmapped: (names) => {
    if (names.length === 0) return;
    const merged = Array.from(new Set([...get().status.unmappedHeroes, ...names]));
    set((s) => ({ status: { ...s.status, unmappedHeroes: merged } }));
  },
}));
