import type { Position } from './hero';

export type ExperienceLevel = 'new' | 'casual' | 'competitive';

/**
 * Optional, purely local player-context data. Used only to compute a
 * separate "Player Fit" score shown alongside — never blended into — the
 * objective analysis. Nothing here is sent anywhere unless the user has
 * also enabled AI requests, and even then only as context for phrasing.
 */
export interface PlayerProfile {
  enabled: boolean;
  preferredPositions: Position[];
  comfortHeroIds: string[];
  avoidHeroIds: string[];
  experienceLevel: ExperienceLevel;
}

export const DEFAULT_PLAYER_PROFILE: PlayerProfile = {
  enabled: false,
  preferredPositions: [],
  comfortHeroIds: [],
  avoidHeroIds: [],
  experienceLevel: 'casual',
};
