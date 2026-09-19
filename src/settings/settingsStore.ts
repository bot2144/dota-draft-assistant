import { create } from 'zustand';
import type { AppSettings } from '../types/settings';
import { DEFAULT_FEATURE_FLAGS } from '../types/settings';
import { DEFAULT_WEIGHTS } from '../analytics/weights.config';
import { DEFAULT_PLAYER_PROFILE } from '../types/player';
import { cacheGetStale, cacheSet } from '../data/cache';
import { aiService } from '../ai/AIService';

const SETTINGS_CACHE_KEY = 'app-settings';

export const DEFAULT_SETTINGS: AppSettings = {
  ai: { provider: 'none' },
  language: 'en',
  theme: 'dark',
  dataSource: 'bundled',
  weights: DEFAULT_WEIGHTS,
  hotkeys: { toggleOverlay: 'CommandOrControl+Shift+D' },
  privacy: { allowAIRequests: true, shareDraftWithAI: true },
  cacheTTLMinutes: 60,
  playerProfile: DEFAULT_PLAYER_PROFILE,
  featureFlags: DEFAULT_FEATURE_FLAGS,
  overlayMode: 'hidden',
  onboarded: false,
  debugMode: false,
};

interface SettingsStoreState {
  settings: AppSettings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => Promise<void>;
  reset: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  load: async () => {
    const stored = await cacheGetStale<AppSettings>(SETTINGS_CACHE_KEY);
    let merged: AppSettings = stored
      ? {
          ...DEFAULT_SETTINGS,
          ...stored,
          weights: { ...DEFAULT_WEIGHTS, ...stored.weights },
          playerProfile: { ...DEFAULT_PLAYER_PROFILE, ...stored.playerProfile },
          featureFlags: { ...DEFAULT_FEATURE_FLAGS, ...stored.featureFlags },
        }
      : DEFAULT_SETTINGS;

    // Optional dev convenience: seed the AI provider from a local .env file
    // on first run only (never overrides an explicit choice already saved
    // in Settings). API keys are otherwise never read from source or env
    // in the packaged app — they live only in the local settings cache.
    if (!stored) {
      const env = import.meta.env;
      const envProvider = env.VITE_AI_PROVIDER as string | undefined;
      if (envProvider === 'anthropic' || envProvider === 'openai' || envProvider === 'compatible') {
        merged = {
          ...merged,
          ai: {
            provider: envProvider,
            apiKey: env.VITE_AI_API_KEY as string | undefined,
            baseUrl: env.VITE_AI_BASE_URL as string | undefined,
            model: env.VITE_AI_MODEL as string | undefined,
          },
        };
      }
    }

    aiService.configure(merged.ai);
    set({ settings: merged, loaded: true });
  },

  update: async (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    if (patch.ai) aiService.configure(next.ai);
    // Long TTL — settings are user-authored config, not perishable cache data.
    await cacheSet(SETTINGS_CACHE_KEY, next, 60 * 24 * 365);
  },

  reset: async () => {
    set({ settings: DEFAULT_SETTINGS });
    aiService.configure(DEFAULT_SETTINGS.ai);
    await cacheSet(SETTINGS_CACHE_KEY, DEFAULT_SETTINGS, 60 * 24 * 365);
  },
}));
