import { describe, it, expect } from 'vitest';
import { parseDraftPaste } from '../pasteParser';

describe('parseDraftPaste', () => {
  it('parses explicit OUR/ENEMY sections', () => {
    const text = `OUR TEAM\nLion\nMars\nCrystal Maiden\n\nENEMY TEAM\nInvoker\nFaceless Void\nMorphling`;
    const result = parseDraftPaste(text);
    expect(result.ally).toEqual(['lion', 'mars', 'crystal-maiden']);
    expect(result.enemy).toEqual(['invoker', 'faceless-void', 'morphling']);
    expect(result.unmatched).toHaveLength(0);
  });

  it('falls back to ally-then-enemy split when no headers are present', () => {
    const text = 'Anti-Mage, Crystal Maiden, Axe, Lion, Juggernaut, Pudge';
    const result = parseDraftPaste(text);
    expect(result.ally).toHaveLength(5);
    expect(result.enemy).toEqual(['pudge']);
  });

  it('reports unmatched lines instead of throwing on garbage input', () => {
    const text = 'OUR TEAM\nNotARealHero\nLion';
    const result = parseDraftPaste(text);
    expect(result.unmatched).toContain('NotARealHero');
    expect(result.ally).toEqual(['lion']);
  });

  it('handles empty input without throwing', () => {
    const result = parseDraftPaste('');
    expect(result.ally).toHaveLength(0);
    expect(result.enemy).toHaveLength(0);
  });
});
