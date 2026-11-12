import { describe, it, expect, vi } from 'vitest';

describe('persistentCache without IndexedDB', () => {
  it('degrades to no-ops', async () => {
    vi.resetModules();
    vi.stubGlobal('indexedDB', undefined);
    const cache = await import('../persistentCache');

    await expect(cache.setPersisted('k', 1)).resolves.toBeUndefined();
    await expect(cache.getPersisted('k')).resolves.toBeUndefined();
    await expect(cache.clearPersisted()).resolves.toBeUndefined();
    vi.unstubAllGlobals();
  });
});
