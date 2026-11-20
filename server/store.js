import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from './config.js';

// Development-only persistence: orders live in memory and are mirrored to a JSON file.
// Replace with a real database (transactions, locking) before taking real orders.

let filePath = join(config.dataDir, 'orders.json');
let orders = [];
let writeQueue = Promise.resolve();

export async function initStore(directory = config.dataDir) {
  filePath = join(directory, 'orders.json');
  orders = [];
  writeQueue = Promise.resolve();
  await mkdir(directory, { recursive: true });

  let raw;
  try {
    raw = await readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return; // first run
    throw error;
  }

  // Never silently start from an empty list: the next save would overwrite the real data.
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Order store ${filePath} is corrupted (${error.message}). Fix or move it aside, then restart.`,
    );
  }
  if (!Array.isArray(parsed)) {
    throw new Error(
      `Order store ${filePath} must contain a JSON array. Fix or move it aside, then restart.`,
    );
  }
  orders = parsed;
}

async function persist(order) {
  const next = [...orders];
  const position = next.findIndex((existing) => existing.id === order.id);
  if (position === -1) next.push(order);
  else next[position] = order;

  // Write to a temp file then rename => the JSON file is never left half-written.
  await writeFile(`${filePath}.tmp`, JSON.stringify(next, null, 2), { mode: 0o600 });
  await rename(`${filePath}.tmp`, filePath);
  orders = next; // only commit to memory once the disk write succeeded
  return order;
}

export function saveOrder(order) {
  const task = writeQueue.then(() => persist(order));
  // One failed write must not poison the queue and break every later save.
  writeQueue = task.catch(() => {});
  return task;
}

/** Resolves when all queued writes have finished (used for graceful shutdown). */
export function flushStore() {
  return writeQueue;
}

/** Returns a copy, so callers cannot change stored data without going through saveOrder. */
export function findOrder(orderId) {
  const order = orders.find((entry) => entry.id === orderId);
  return order ? structuredClone(order) : undefined;
}
