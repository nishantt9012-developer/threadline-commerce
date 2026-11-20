// @vitest-environment node
import { afterAll, beforeAll, expect, it } from 'vitest';
import { createServer } from 'vite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import storeApi from '../scripts/store-api.mjs';
import { config } from '../server/config.js';
let server, directory, base;
const originalDirectory = config.dataDir;
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'threadline-api-test-'));
  config.dataDir = directory;
  server = await createServer({
    configFile: false,
    plugins: [storeApi()],
    mode: 'development',
    appType: 'custom',
    server: { host: '127.0.0.1', port: 0, watch: null },
  });
  await server.listen();
  base = `http://127.0.0.1:${server.httpServer.address().port}`;
});
afterAll(async () => {
  await server?.close();
  config.dataDir = originalDirectory;
  if (directory) await rm(directory, { recursive: true, force: true });
});
it('serves payment configuration on the website without a separate API server', async () => {
  const health = await fetch(base + '/api/health');
  expect(await health.json()).toEqual({ ok: true });
  const response = await fetch(base + '/api/config');
  expect(response.status).toBe(200);
  expect(await response.json()).toHaveProperty('razorpayEnabled');
});
it('places and persists a real COD order through Vite using server prices', async () => {
  const response = await fetch(base + '/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '9876543210',
        address: '12 Test Road',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
      },
      cart: [{ productId: 1, size: 'M', quantity: 2, price: 1 }],
      paymentMethod: 'cod',
    }),
  });
  expect(response.status).toBe(201);
  expect(await response.json()).toMatchObject({ status: 'confirmed', total: 1697 });
});
