import { create } from 'zustand';
import type { HeroLiveStats } from '../types/hero';
import type { DataSourceMode } from '../types/settings';
import { dataRepository, type DataStatus } from '../data/DataRepository';
import { patchManager } from '../patch/PatchManager';

interface LiveDataState {
  liveStats: Map<string, HeroLiveStats>;
  status: DataStatus;
  patchLabel: string;
  refresh: (mode: DataSourceMode, opts?: { forceRefresh?: boolean }) => Promise<void>;
}

export const useLiveDataStore = create<LiveDataState>((set) => ({
  liveStats: new Map(),
  status: { mode: 'bundled', usingLiveStats: false },
  patchLabel: patchManager.getCurrentPatch().label,

  refresh: async (mode, opts) => {
    const patch = await dataRepository.getPatch(mode);
    const stats = await dataRepository.getLiveStats(mode, patch.id, opts);
    set({ liveStats: stats, status: dataRepository.getStatus(), patchLabel: patch.label });
  },
}));
