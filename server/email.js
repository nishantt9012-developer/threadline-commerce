import { ORDER_STATUS, PAYMENT_STATUS, EMAIL_STATUS } from '../src/constants/index.js';
import { config } from './config.js';
import { findOrder, saveOrder } from './store.js';

const sending = new Set();
const money = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);

/** This function is used for escaping customer and product text before inserting it into email HTML. */
export function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
}

/** This function is used for building matching plain-text and HTML order receipts from server totals. */
export function orderEmail(order, owner = false) {
  const customer = order.customer;
  const payment =
    order.paymentStatus === PAYMENT_STATUS.PAID
      ? 'Paid online'
      : 'Cash on delivery — payment due on delivery';
  const heading = owner ? 'New confirmed order' : 'Your order is confirmed';
  const lines = [
    heading,
    `Order: ${order.id}`,
    owner ? `Customer: ${customer.name}` : `Hello ${customer.name},`,
    ...order.items.map(
      (item) =>
        `${item.name} | Size ${item.size} | Qty ${item.quantity} | ${money(item.unitPrice * item.quantity)}`,
    ),
    `Subtotal: ${money(order.subtotal)}`,
    `Delivery: ${money(order.shipping)}`,
    `Total: ${money(order.total)}`,
    payment,
    'Delivery address:',
    customer.name,
    customer.address,
    customer.landmark,
    `${customer.city}, ${customer.state} ${customer.pincode}`,
    ...(owner
      ? [`Customer email: ${customer.email}`, `Phone: ${customer.phone}`]
      : ['Keep this reference for your order.']),
  ].filter(Boolean);
  return {
    subject: `${owner ? 'New order' : 'Order confirmed'} | ${order.id} | Threadline`,
    text: lines.join('\n'),
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#21211f;padding:28px;border:1px solid #dedfd9"><h2>THREADLINE.</h2>${lines.map((line, index) => (index === 0 ? `<h1 style="font-size:26px">${escapeHtml(line)}</h1>` : `<p style="line-height:1.6">${escapeHtml(line)}</p>`)).join('')}</div>`,
  };
}

/** This function is used for recording provider acceptance without making email failure fail an order. */
export async function notifyOrder(orderId) {
  if (sending.has(orderId)) return;
  sending.add(orderId);
  try {
    let order = findOrder(orderId);
    if (!order || order.status !== ORDER_STATUS.CONFIRMED) return;
    for (const recipient of ['customer', 'owner']) {
      order = findOrder(orderId);
      if (order.emailNotifications?.[recipient]?.status === EMAIL_STATUS.ACCEPTED) continue;
      let result = { status: EMAIL_STATUS.NOT_CONFIGURED };
      const to = recipient === 'customer' ? order.customer.email : config.orderNotifyEmail;
      if (config.resendApiKey && config.emailFrom && to) {
        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            signal: AbortSignal.timeout(8000),
            headers: {
              Authorization: `Bearer ${config.resendApiKey}`,
              'Content-Type': 'application/json',
              'Idempotency-Key': `order-confirmed/${order.id}/${recipient}`,
            },
            body: JSON.stringify({
              from: config.emailFrom,
              to: [to],
              ...(config.emailReplyTo ? { reply_to: config.emailReplyTo } : {}),
              ...orderEmail(order, recipient === 'owner'),
            }),
          });
          const data = await response.json().catch(() => null);
          if (!response.ok || typeof data?.id !== 'string')
            throw new Error('Email provider did not accept the message');
          result = {
            status: EMAIL_STATUS.ACCEPTED,
            providerId: data.id,
            acceptedAt: new Date().toISOString(),
          };
        } catch {
          result = { status: EMAIL_STATUS.FAILED, lastAttemptAt: new Date().toISOString() };
          console.error(
            `[email] ${recipient} notification failed for order ${order.id}; order remains confirmed.`,
          );
        }
      }
      const current = findOrder(orderId);
      await saveOrder({
        ...current,
        emailNotifications: { ...current.emailNotifications, [recipient]: result },
      });
    }
  } catch {
    console.error(
      `[email] Could not update notification status for order ${orderId}; order remains saved.`,
    );
  } finally {
    sending.delete(orderId);
  }
}
