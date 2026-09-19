import type { AIProviderConfig } from './ai';
import type { ScoreWeights } from './scoring';
import type { PlayerProfile } from './player';

export type Language = 'en' | 'ru';
export type Theme = 'dark' | 'darker';
export type DataSourceMode = 'bundled' | 'remote-opendota';
export type OverlayMode = 'full' | 'compact' | 'minimal' | 'hidden';

export interface HotkeyConfig {
  toggleOverlay: string; // e.g. "CommandOrControl+Shift+D" — controls only this app's own window(s), never the game.
}

export interface PrivacySettings {
  allowAIRequests: boolean;
  shareDraftWithAI: boolean;
}

export interface FeatureFlags {
  overlay: boolean;
  aiExplanations: boolean;
  simulator: boolean;
  whatIf: boolean;
  playerProfile: boolean;
  experimental: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  overlay: true,
  aiExplanations: true,
  simulator: true,
  whatIf: true,
  playerProfile: true,
  experimental: false,
};

export interface AppSettings {
  ai: AIProviderConfig;
  language: Language;
  theme: Theme;
  dataSource: DataSourceMode;
  weights: ScoreWeights;
  hotkeys: HotkeyConfig;
  privacy: PrivacySettings;
  cacheTTLMinutes: number;
  playerProfile: PlayerProfile;
  featureFlags: FeatureFlags;
  overlayMode: OverlayMode;
  onboarded: boolean;
  debugMode: boolean;
}
