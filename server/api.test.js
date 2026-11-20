// @vitest-environment node
import { createHmac } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';
import { config } from './config.js';
import { initStore } from './store.js';

const silent = { info() {}, error() {} };
const customer = {
  name: 'Sample Customer',
  email: 'sample@example.com',
  phone: '9876543210',
  address: '12 Sample Road',
  city: 'Delhi',
  state: 'Delhi',
  pincode: '110001',
};
const cart = [{ productId: 1, size: 'M', quantity: 2 }]; // 1598 + 99 shipping = 1697

let server;
let baseUrl;
let dataDir;
const realFetch = globalThis.fetch;
const originalConfig = { ...config };

beforeAll(async () => {
  server = createApp({ logger: silent });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
afterAll(() => new Promise((resolve) => server.close(resolve)));

beforeEach(async () => {
  dataDir = await mkdtemp(join(tmpdir(), 'threadline-api-'));
  await initStore(dataDir);
  Object.assign(config, originalConfig);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(async () => {
  vi.unstubAllGlobals();
  await rm(dataDir, { recursive: true, force: true });
});

const post = (path, body, init = {}) =>
  realFetch(baseUrl + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    ...init,
  });
const savedOrders = async () => JSON.parse(await readFile(join(dataDir, 'orders.json'), 'utf8'));

describe('routing and robustness', () => {
  it('answers health and config', async () => {
    expect((await realFetch(`${baseUrl}/api/health`)).status).toBe(200);
    const body = await (await realFetch(`${baseUrl}/api/config`)).json();
    expect(body.razorpayEnabled).toBe(false);
  });

  it('returns 404 for unknown paths and 405 (with Allow) for wrong methods', async () => {
    expect((await realFetch(`${baseUrl}/api/nope`)).status).toBe(404);
    const wrong = await realFetch(`${baseUrl}/api/orders`);
    expect(wrong.status).toBe(405);
    expect(wrong.headers.get('allow')).toBe('POST');
  });

  it('survives a malformed request URL instead of crashing the process (regression)', async () => {
    const reply = await new Promise((resolve, reject) => {
      const socket = net.connect(server.address().port, '127.0.0.1');
      let data = '';
      socket.on('data', (chunk) => (data += chunk));
      socket.on('close', () => resolve(data));
      socket.on('error', reject);
      socket.write('GET // HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n');
    });
    expect(reply).toMatch(/^HTTP\/1\.1 400/);
    expect((await realFetch(`${baseUrl}/api/health`)).status).toBe(200); // still alive
  });

  it.each([
    ['null', 'null'],
    ['an array', '[]'],
    ['a number', '5'],
    ['invalid JSON', '{oops'],
    ['an empty body', ''],
  ])('rejects a body that is %s with 400, not 500 (regression)', async (_label, raw) => {
    const response = await post('/api/orders', raw);
    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty('error');
  });

  it('rejects oversized bodies with 413 and still delivers the response', async () => {
    const response = await post('/api/orders', JSON.stringify({ junk: 'x'.repeat(60_000) }));
    expect(response.status).toBe(413);
  });
});

describe('POST /api/orders (cash on delivery)', () => {
  it('prices the order on the server, saves it, and leaks no customer data', async () => {
    const response = await post('/api/orders', {
      customer,
      cart: [{ ...cart[0], price: 1 }], // tampered price must be ignored
      paymentMethod: 'cod',
    });
    expect(response.status).toBe(201);
    const order = await response.json();
    expect(order).toMatchObject({ status: 'confirmed', paymentStatus: 'unpaid', total: 1697 });
    expect(order).not.toHaveProperty('customer');
    expect(order.keyId).toBeNull();

    const [stored] = await savedOrders();
    expect(stored.id).toBe(order.id);
    expect(stored.customer.email).toBe(customer.email);
  });

  it.each([
    ['unknown payment method', { customer, cart, paymentMethod: 'bitcoin' }],
    ['invalid customer', { customer: { ...customer, pincode: '1' }, cart, paymentMethod: 'cod' }],
    ['null cart line (used to be a 500)', { customer, cart: [null], paymentMethod: 'cod' }],
    ['empty cart', { customer, cart: [], paymentMethod: 'cod' }],
  ])('rejects %s with 400', async (_label, body) => {
    expect((await post('/api/orders', body)).status).toBe(400);
  });

  it('returns 503 when online payment is requested but not configured', async () => {
    const response = await post('/api/orders', { customer, cart, paymentMethod: 'razorpay' });
    expect(response.status).toBe(503);
  });

  it('hides internals on unexpected failures but returns a reference id, and recovers afterwards', async () => {
    await rm(dataDir, { recursive: true }); // make the disk write fail
    const failed = await post('/api/orders', { customer, cart, paymentMethod: 'cod' });
    expect(failed.status).toBe(500);
    const body = await failed.json();
    expect(body.error).toBe('Unable to process request');
    expect(body.requestId).toMatch(/^[a-f0-9]{8}$/);
    expect(JSON.stringify(body)).not.toMatch(/ENOENT|\/tmp|at /);

    await mkdir(dataDir); // disk is back: the very next order must work
    const ok = await post('/api/orders', { customer, cart, paymentMethod: 'cod' });
    expect(ok.status).toBe(201);
  });
});

describe('Razorpay flow (gateway mocked)', () => {
  const SECRET = 'test_secret';
  const sign = (orderId, paymentId) =>
    createHmac('sha256', SECRET).update(`${orderId}|${paymentId}`).digest('hex');

  // Only api.razorpay.com is faked; requests to our own test server go through untouched.
  function mockGateway({ payment, delay = 0 } = {}) {
    const calls = [];
    vi.stubGlobal('fetch', async (url, init) => {
      if (!String(url).startsWith('https://api.razorpay.com/v1/')) return realFetch(url, init);
      calls.push({ url: String(url), method: init?.method ?? 'GET' });
      const json = (data) => new Response(JSON.stringify(data), { status: 200 });
      if (String(url).endsWith('/orders')) return json({ id: 'order_RZP1' });
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      return json(
        payment ?? {
          id: 'pay_1',
          status: 'captured',
          order_id: 'order_RZP1',
          amount: 169700,
          currency: 'INR',
        },
      );
    });
    return calls;
  }

  async function createPendingOrder() {
    Object.assign(config, { razorpayKeyId: 'rzp_test_x', razorpayKeySecret: SECRET });
    const response = await post('/api/orders', { customer, cart, paymentMethod: 'razorpay' });
    expect(response.status).toBe(201);
    return response.json();
  }
  const verify = (order, overrides = {}) =>
    post('/api/payments/verify', {
      orderId: order.id,
      razorpay_order_id: 'order_RZP1',
      razorpay_payment_id: 'pay_1',
      razorpay_signature: sign('order_RZP1', 'pay_1'),
      ...overrides,
    });

  it('creates a gateway order in paise and exposes only the public key', async () => {
    const calls = mockGateway();
    const order = await createPendingOrder();
    expect(order).toMatchObject({
      status: 'pending_payment',
      razorpayOrderId: 'order_RZP1',
      keyId: 'rzp_test_x',
    });
    expect(JSON.stringify(order)).not.toContain(SECRET);
    expect(calls[0]).toMatchObject({ method: 'POST', url: expect.stringMatching(/\/orders$/) });
  });

  it('marks the order paid only after signature AND gateway capture check, and rejects replays', async () => {
    mockGateway();
    const order = await createPendingOrder();

    const paid = await verify(order);
    expect(paid.status).toBe(200);
    expect(await paid.json()).toMatchObject({ status: 'confirmed', paymentStatus: 'paid' });
    expect((await savedOrders())[0]).toMatchObject({ paymentStatus: 'paid', paymentId: 'pay_1' });

    expect((await verify(order)).status).toBe(409); // replay of the same callback
  });

  it('rejects a forged signature and leaves the order pending', async () => {
    mockGateway();
    const order = await createPendingOrder();
    const forged = await verify(order, { razorpay_signature: 'a'.repeat(64) });
    expect(forged.status).toBe(400);
    expect((await savedOrders())[0].status).toBe('pending_payment');
  });

  it('rejects malformed verification payloads with 400', async () => {
    mockGateway();
    const order = await createPendingOrder();
    expect((await verify(order, { razorpay_signature: 'short' })).status).toBe(400);
    expect((await verify(order, { razorpay_payment_id: 123 })).status).toBe(400);
    expect((await verify(order, { razorpay_order_id: 'other' })).status).toBe(400);
  });

  it('rejects a valid signature when the gateway says the payment is not captured / wrong amount', async () => {
    mockGateway({
      payment: {
        id: 'pay_1',
        status: 'authorized',
        order_id: 'order_RZP1',
        amount: 169700,
        currency: 'INR',
      },
    });
    const order = await createPendingOrder();
    expect((await verify(order)).status).toBe(400);
    expect((await savedOrders())[0].status).toBe('pending_payment');
  });

  it('returns 404 for an unknown order', async () => {
    mockGateway();
    await createPendingOrder();
    expect((await verify({ id: 'does-not-exist' })).status).toBe(404);
  });

  it('lets only one of two simultaneous callbacks through', async () => {
    mockGateway({ delay: 50 });
    const order = await createPendingOrder();
    const statuses = (await Promise.all([verify(order), verify(order)]))
      .map((r) => r.status)
      .sort();
    expect(statuses).toEqual([200, 409]);
  });

  it('reports 502 when the gateway is unreachable', async () => {
    vi.stubGlobal('fetch', async (url, init) => {
      if (String(url).startsWith('https://api.razorpay.com')) throw new TypeError('fetch failed');
      return realFetch(url, init);
    });
    Object.assign(config, { razorpayKeyId: 'rzp_test_x', razorpayKeySecret: SECRET });
    const response = await post('/api/orders', { customer, cart, paymentMethod: 'razorpay' });
    expect(response.status).toBe(502);
    expect(await savedOrders().catch(() => [])).toHaveLength(0); // nothing half-saved
  });
});
