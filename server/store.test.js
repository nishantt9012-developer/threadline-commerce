// @vitest-environment node
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findOrder, flushStore, initStore, saveOrder } from './store.js';

let dir;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'threadline-store-'));
});
afterEach(() => rm(dir, { recursive: true, force: true }));

describe('order store', () => {
  it('saves, updates and reloads orders from disk', async () => {
    await initStore(dir);
    await saveOrder({ id: 'a', status: 'pending' });
    await saveOrder({ id: 'a', status: 'paid' });

    await initStore(dir); // simulate a restart
    expect(findOrder('a')).toEqual({ id: 'a', status: 'paid' });
    expect(JSON.parse(await readFile(join(dir, 'orders.json'), 'utf8'))).toHaveLength(1);
  });

  it('returns copies so callers cannot mutate stored data (regression)', async () => {
    await initStore(dir);
    await saveOrder({ id: 'a', status: 'pending' });
    findOrder('a').status = 'hacked';
    expect(findOrder('a').status).toBe('pending');
  });

  it('keeps working after one write fails (regression: queue used to be poisoned forever)', async () => {
    await initStore(dir);
    await saveOrder({ id: 'a' });

    await rm(dir, { recursive: true }); // simulate the disk disappearing
    await expect(saveOrder({ id: 'b' })).rejects.toThrow();
    expect(findOrder('b')).toBeUndefined(); // memory must not claim a save that never happened

    await mkdir(dir); // disk is healthy again - NO restart, the same store instance must recover
    await expect(saveOrder({ id: 'c' })).resolves.toBeDefined();
    await flushStore();
    expect(findOrder('c')).toBeDefined();
    expect(findOrder('a')).toBeDefined(); // earlier data untouched
  });

  it('refuses to start on a corrupted file instead of silently wiping orders', async () => {
    await writeFile(join(dir, 'orders.json'), '{ not json');
    await expect(initStore(dir)).rejects.toThrow(/corrupted/);

    await writeFile(join(dir, 'orders.json'), '{"a":1}');
    await expect(initStore(dir)).rejects.toThrow(/JSON array/);
  });
});
