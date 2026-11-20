// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { config } from './config.js';
import { initStore, findOrder, saveOrder } from './store.js';
import { placeOrder, confirmPayment } from './orders.js';
import { notifyOrder, orderEmail } from './email.js';
const original = { ...config };
let directory;
const customer = {
  name: 'Test <Customer>',
  email: 'customer@example.com',
  phone: '9876543210',
  address: '12 Test Road',
  city: 'Delhi',
  state: 'Delhi',
  pincode: '110001',
};
const payload = {
  customer,
  cart: [{ productId: 1, size: 'M', quantity: 1 }],
  paymentMethod: 'cod',
};
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'threadline-mail-'));
  await initStore(directory);
  Object.assign(config, {
    resendApiKey: 'test-key',
    emailFrom: 'Threadline <orders@example.com>',
    orderNotifyEmail: 'owner@example.com',
    emailReplyTo: 'support@example.com',
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(async () => {
  Object.assign(config, original);
  vi.unstubAllGlobals();
  await rm(directory, { recursive: true, force: true });
});
const accept = () =>
  vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ id: 'email-123' }), { status: 200 })),
    );
it('sends separate customer and owner receipts after persisting COD, with correct totals and escaped HTML', async () => {
  const send = accept();
  vi.stubGlobal('fetch', send);
  const receipt = await placeOrder(payload);
  expect(send).toHaveBeenCalledTimes(2);
  const messages = send.mock.calls.map(([, options]) => JSON.parse(options.body));
  expect(messages[0].to).toEqual(['customer@example.com']);
  expect(messages[1].to).toEqual(['owner@example.com']);
  expect(messages[0].html).toContain('Test &lt;Customer&gt;');
  expect(messages[0].text).toContain('898.00');
  expect(messages[0].reply_to).toBe('support@example.com');
  expect(messages[1].text).toContain(customer.phone);
  expect(findOrder(receipt.id).emailNotifications.customer.status).toBe('accepted');
  await notifyOrder(receipt.id);
  expect(send).toHaveBeenCalledTimes(2);
});
it('keeps the order confirmed when emails fail and retries only failed recipients', async () => {
  const send = vi
    .fn()
    .mockRejectedValueOnce(Error('timeout'))
    .mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ id: 'owner-1' }), { status: 200 })),
    );
  vi.stubGlobal('fetch', send);
  const receipt = await placeOrder(payload);
  expect(receipt.status).toBe('confirmed');
  expect(findOrder(receipt.id).emailNotifications.customer.status).toBe('failed');
  const key = send.mock.calls[0][1].headers['Idempotency-Key'];
  await notifyOrder(receipt.id);
  expect(send).toHaveBeenCalledTimes(3);
  expect(send.mock.calls[2][1].headers['Idempotency-Key']).toBe(key);
  expect(findOrder(receipt.id).emailNotifications.customer.status).toBe('accepted');
});
it('records not configured without making a network request or losing the order', async () => {
  config.resendApiKey = '';
  const send = accept();
  vi.stubGlobal('fetch', send);
  const receipt = await placeOrder(payload);
  expect(send).not.toHaveBeenCalled();
  expect(findOrder(receipt.id).emailNotifications.owner.status).toBe('not_configured');
});
it('never sends a confirmation for an unpaid online order, then sends after confirmed paid state', async () => {
  const send = accept();
  vi.stubGlobal('fetch', send);
  const order = {
    id: 'online-test',
    customer,
    items: [{ name: 'Test shirt', size: 'M', quantity: 1, unitPrice: 799 }],
    subtotal: 799,
    shipping: 99,
    total: 898,
    status: 'pending_payment',
    paymentMethod: 'razorpay',
    paymentStatus: 'unpaid',
  };
  await saveOrder(order);
  await notifyOrder(order.id);
  expect(send).not.toHaveBeenCalled();
  await saveOrder({ ...order, status: 'confirmed', paymentStatus: 'paid' });
  await notifyOrder(order.id);
  expect(send).toHaveBeenCalledTimes(2);
  expect(orderEmail({ ...order, paymentStatus: 'paid' }).text).toContain('Paid online');
});
it('does not send emails when payment verification is rejected', async () => {
  const send = accept();
  vi.stubGlobal('fetch', send);
  await saveOrder({
    id: 'bad-online',
    status: 'pending_payment',
    paymentMethod: 'razorpay',
    customer,
  });
  await expect(confirmPayment({ orderId: 'bad-online' })).rejects.toThrow();
  expect(send).not.toHaveBeenCalled();
});
