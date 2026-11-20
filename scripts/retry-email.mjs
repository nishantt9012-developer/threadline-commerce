import { ORDER_STATUS } from '../src/constants/index.js';
import { config } from '../server/config.js';
import { notifyOrder } from '../server/email.js';
import { findOrder, initStore } from '../server/store.js';

// Retry a saved order's unaccepted notifications only; never create another order.
const id = process.argv[2];
if (!id || !/^[a-f0-9-]{36}$/i.test(id)) throw new Error('Usage: npm run email:retry -- ORDER_ID');
if (!config.resendApiKey || !config.emailFrom)
  throw new Error('Set RESEND_API_KEY and EMAIL_FROM in .env first.');
await initStore();
const order = findOrder(id);
if (!order || order.status !== ORDER_STATUS.CONFIRMED)
  throw new Error('A confirmed order is required.');
await notifyOrder(id);
console.log(findOrder(id).emailNotifications);
