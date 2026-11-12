import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPersisted, setPersisted, clearPersisted, CACHE_TTL_MS } from '../persistentCache';

describe('persistentCache', () => {
  beforeEach(async () => {
    await clearPersisted();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns undefined for unknown keys', async () => {
    expect(await getPersisted('missing')).toBeUndefined();
  });

  it('stores and returns values', async () => {
    await setPersisted('k', { id: 1, names: ['a'] });
    expect(await getPersisted('k')).toEqual({ id: 1, names: ['a'] });
  });

  it('expires entries after their TTL', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    await setPersisted('k', 'v');

    vi.setSystemTime(Date.now() + CACHE_TTL_MS - 1000);
    expect(await getPersisted('k')).toBe('v');

    vi.setSystemTime(Date.now() + 2000);
    expect(await getPersisted('k')).toBeUndefined();
  });

  it('clears everything', async () => {
    await setPersisted('a', 1);
    await setPersisted('b', 2);
    await clearPersisted();
    expect(await getPersisted('a')).toBeUndefined();
    expect(await getPersisted('b')).toBeUndefined();
  });
});
