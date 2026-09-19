import { describe, it, expect } from 'vitest';
import { roleAnalyzer } from '../RoleAnalyzer';
import { requireHero } from '../../data/heroes';

describe('RoleAnalyzer', () => {
  it('reports all core roles missing for an empty team', () => {
    const missing = roleAnalyzer.missingRoles([]);
    expect(missing).toContain('Carry');
    expect(missing).toContain('Support');
  });

  it('flags a missing-role issue only once the draft is substantially underway', () => {
    const oneHero = [requireHero('anti-mage')];
    expect(roleAnalyzer.analyzeIssues(oneHero, [])).toHaveLength(0); // too early to complain

    const fourHeroes = [
      requireHero('anti-mage'),
      requireHero('anti-mage'), // duplicate on purpose: analyzer must not throw
      requireHero('juggernaut'),
      requireHero('drow-ranger'),
    ];
    const issues = roleAnalyzer.analyzeIssues(fourHeroes, []);
    expect(issues.some((i) => i.type === 'missing-role')).toBe(true);
  });

  it('detects illusion-vulnerable draft issue', () => {
    const ally = [requireHero('drow-ranger'), requireHero('sniper'), requireHero('lina')];
    const enemy = [requireHero('phantom-lancer')];
    const issues = roleAnalyzer.analyzeIssues(ally, enemy);
    expect(issues.some((i) => i.type === 'illusion-vulnerable')).toBe(true);
  });

  it('scores role completion higher when the hero fills a missing role', () => {
    const ally = [requireHero('anti-mage'), requireHero('drow-ranger'), requireHero('sniper')];
    const disabler = requireHero('lion'); // Support/Disabler — fills gap
    const anotherCarry = requireHero('juggernaut'); // Carry — already covered
    const disablerScore = roleAnalyzer.roleCompletionScore(disabler, ally);
    const carryScore = roleAnalyzer.roleCompletionScore(anotherCarry, ally);
    expect(disablerScore.score).toBeGreaterThan(carryScore.score);
  });

  it('openPositions returns all 5 for an empty draft and fewer as slots fill', () => {
    expect(roleAnalyzer.openPositions([])).toEqual([1, 2, 3, 4, 5]);
    expect(roleAnalyzer.openPositions([{ position: 1 }, { position: 3 }])).toEqual([2, 4, 5]);
  });
});
