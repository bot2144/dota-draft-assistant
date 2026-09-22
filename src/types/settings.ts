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

/**
 * Dota 2 Game State Integration settings. GSI is Valve's own, officially
 * documented local-HTTP mechanism for the game to report live match state
 * (draft picks/bans, game clock) — configured entirely via a plain-text
 * .cfg file the player (or this app, with their consent) drops into their
 * own Dota 2 install. It is never process/memory access and carries none
 * of the anti-cheat risk that would come with reading the game's memory.
 */
export interface GsiSettings {
  enabled: boolean;
  port: number;
  /** Auto-fill detected picks/bans into the draft board as they happen. Never overwrites a manual entry. */
  autoFillDraft: boolean;
  /** Which side is "ours" for auto-fill. 'auto' uses the side GSI itself reports for the local player. */
  mySide: 'auto' | 'radiant' | 'dire';
}

export const DEFAULT_GSI_SETTINGS: GsiSettings = {
  enabled: false,
  port: 3665,
  autoFillDraft: true,
  mySide: 'auto',
};

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
  /** Keep this app's own window above other windows (desktop only). Never affects the game process itself. */
  alwaysOnTop: boolean;
  gsi: GsiSettings;
}
