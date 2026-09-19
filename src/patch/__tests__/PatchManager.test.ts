import { describe, it, expect, beforeEach } from 'vitest';
import { PatchManager } from '../PatchManager';

describe('PatchManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes to the bundled snapshot patch when no cache exists', async () => {
    const pm = new PatchManager();
    const patch = await pm.init();
    expect(patch.id).toBe(PatchManager.bundled().id);
  });

  it('never mixes patches: setPatch overwrites, does not merge, the active patch', async () => {
    const pm = new PatchManager();
    await pm.init();
    await pm.setPatch({ id: '7.40', label: 'Patch 7.40' });
    expect(pm.getCurrentPatch().id).toBe('7.40');
    await pm.setPatch({ id: '7.41', label: 'Patch 7.41' });
    expect(pm.getCurrentPatch().id).toBe('7.41');
    expect(pm.getCurrentPatch().label).not.toContain('7.40');
  });

  it('persists the chosen patch across manager instances (cache-backed)', async () => {
    const pmA = new PatchManager();
    await pmA.init();
    await pmA.setPatch({ id: '7.42', label: 'Patch 7.42' });

    const pmB = new PatchManager();
    const patch = await pmB.init();
    expect(patch.id).toBe('7.42');
  });
});
