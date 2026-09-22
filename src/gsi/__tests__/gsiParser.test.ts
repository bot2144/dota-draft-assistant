import { describe, it, expect } from 'vitest';
import { parseDraftFromGsiPayload } from '../gsiParser';
import { mapNpcNameToHeroId } from '../heroNpcMap';
import { ALL_HEROES } from '../../data/heroes';

const SLUGS = ALL_HEROES.map((h) => h.id);

describe('heroNpcMap', () => {
  it('maps regular dash-to-underscore heroes', () => {
    expect(mapNpcNameToHeroId('npc_dota_hero_axe', SLUGS)).toBe('axe');
    expect(mapNpcNameToHeroId('npc_dota_hero_crystal_maiden', SLUGS)).toBe('crystal-maiden');
  });

  it('maps known legacy-name exceptions', () => {
    expect(mapNpcNameToHeroId('npc_dota_hero_antimage', SLUGS)).toBe('anti-mage');
    expect(mapNpcNameToHeroId('npc_dota_hero_nevermore', SLUGS)).toBe('shadow-fiend');
    expect(mapNpcNameToHeroId('npc_dota_hero_wisp', SLUGS)).toBe('io');
    expect(mapNpcNameToHeroId('npc_dota_hero_zuus', SLUGS)).toBe('zeus');
    expect(mapNpcNameToHeroId('npc_dota_hero_skeleton_king', SLUGS)).toBe('wraith-king');
  });

  it('returns null for an unrecognized name rather than guessing', () => {
    expect(mapNpcNameToHeroId('npc_dota_hero_totally_made_up', SLUGS)).toBeNull();
  });
});

describe('parseDraftFromGsiPayload', () => {
  it('returns empty result when there is no draft section', () => {
    const result = parseDraftFromGsiPayload({ map: { name: 'start' } }, SLUGS);
    expect(result.radiantPicks).toEqual([]);
    expect(result.direPicks).toEqual([]);
  });

  it('extracts picks and bans per team from a realistic payload', () => {
    const payload = {
      player: { team_name: 'dire' },
      draft: {
        activeteam: 3,
        team2: {
          home_team: true,
          pick0_class: 'npc_dota_hero_axe',
          ban0_class: 'npc_dota_hero_antimage',
        },
        team3: {
          home_team: false,
          pick0_class: 'npc_dota_hero_pudge',
          pick1_class: 'npc_dota_hero_nevermore',
        },
      },
    };
    const result = parseDraftFromGsiPayload(payload, SLUGS);
    expect(result.radiantPicks).toEqual(['axe']);
    expect(result.radiantBans).toEqual(['anti-mage']);
    expect(result.direPicks).toEqual(['pudge', 'shadow-fiend']);
    expect(result.mySide).toBe('dire');
    expect(result.unmapped).toEqual([]);
  });

  it('reports unmapped hero names instead of dropping them silently', () => {
    const payload = {
      draft: { team2: { pick0_class: 'npc_dota_hero_totally_made_up' } },
    };
    const result = parseDraftFromGsiPayload(payload, SLUGS);
    expect(result.radiantPicks).toEqual([]);
    expect(result.unmapped).toEqual(['npc_dota_hero_totally_made_up']);
  });
});
