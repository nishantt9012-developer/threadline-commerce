import { PAYMENT_METHOD, ORDER_STATUS } from '../src/constants/index.js';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';
import { HttpError } from './errors.js';

const BASE_URL = 'https://api.razorpay.com/v1';
const REQUEST_TIMEOUT_MS = 15_000;

export function paymentConfig() {
  return {
    razorpayEnabled: Boolean(config.razorpayKeyId && config.razorpayKeySecret),
    razorpayKeyId: config.razorpayKeyId,
  };
}

async function gatewayRequest(path, { method = 'GET', body } = {}) {
  if (!paymentConfig().razorpayEnabled) {
    throw new HttpError(503, 'Online payments are not configured');
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}/${path}`, {
      method,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    // Network failure or timeout: log the cause, tell the client something useful but generic.
    console.error('Razorpay request failed:', error);
    throw new HttpError(502, 'Payment provider is unreachable. Please try again.');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) {
    console.error('Razorpay error response:', response.status, payload);
    throw new HttpError(502, payload?.error?.description ?? 'Payment provider error');
  }
  return payload;
}

export function createGatewayOrder(order) {
  return gatewayRequest('orders', {
    method: 'POST',
    body: {
      amount: order.total * 100, // paise
      currency: order.currency,
      receipt: order.id.slice(0, 35),
      notes: { internalOrderId: order.id },
    },
  });
}

function signaturesMatch(expectedHex, receivedHex) {
  const expected = Buffer.from(expectedHex, 'hex');
  const received = Buffer.from(receivedHex, 'hex');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function verifyGatewayPayment(order, payment) {
  if (
    !order ||
    order.paymentMethod !== PAYMENT_METHOD.ONLINE ||
    order.status !== ORDER_STATUS.PENDING_PAYMENT
  ) {
    throw new HttpError(409, 'Invalid or already processed order');
  }

  const { razorpay_order_id: gatewayOrderId, razorpay_payment_id: paymentId } = payment;
  const signature = payment.razorpay_signature;
  if (
    gatewayOrderId !== order.razorpayOrderId ||
    typeof paymentId !== 'string' ||
    !/^[\w-]{1,64}$/.test(paymentId) ||
    typeof signature !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(signature)
  ) {
    throw new HttpError(400, 'Invalid payment verification');
  }

  const expected = createHmac('sha256', config.razorpayKeySecret)
    .update(`${order.razorpayOrderId}|${paymentId}`)
    .digest('hex');
  if (!signaturesMatch(expected, signature)) {
    throw new HttpError(400, 'Payment signature check failed');
  }

  // A valid callback signature alone does not prove the money was captured: ask the gateway.
  const captured = await gatewayRequest(`payments/${encodeURIComponent(paymentId)}`);
  if (
    captured.status !== 'captured' ||
    captured.order_id !== order.razorpayOrderId ||
    captured.amount !== order.total * 100 ||
    captured.currency !== order.currency
  ) {
    throw new HttpError(400, 'Payment is not captured or does not match order');
  }
  return captured;
}
