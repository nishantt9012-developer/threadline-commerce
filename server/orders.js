import { PAYMENT_METHOD, ORDER_STATUS, PAYMENT_STATUS } from '../src/constants/index.js';
import { notifyOrder } from './email.js';
import { randomUUID } from 'node:crypto';
import { HttpError, badRequest } from './errors.js';
import { findOrder, saveOrder } from './store.js';
import { calculateOrder, validateCustomer } from './validation.js';
import { createGatewayOrder, paymentConfig, verifyGatewayPayment } from './payments.js';

const PAYMENT_METHODS = [PAYMENT_METHOD.COD, PAYMENT_METHOD.ONLINE];
const confirmationsInFlight = new Set();

export async function placeOrder(payload) {
  const { paymentMethod } = payload;
  if (!PAYMENT_METHODS.includes(paymentMethod)) throw badRequest('Choose a payment method');

  const customer = validateCustomer(payload.customer);
  const pricing = calculateOrder(payload.cart); // prices are always computed here, never trusted
  if (paymentMethod === PAYMENT_METHOD.ONLINE && !paymentConfig().razorpayEnabled) {
    throw new HttpError(503, 'Online payments are not configured');
  }

  const order = {
    id: randomUUID(),
    customer,
    ...pricing,
    paymentMethod,
    status:
      paymentMethod === PAYMENT_METHOD.COD ? ORDER_STATUS.CONFIRMED : ORDER_STATUS.PENDING_PAYMENT,
    paymentStatus: PAYMENT_STATUS.UNPAID,
    createdAt: new Date().toISOString(),
  };

  if (paymentMethod === PAYMENT_METHOD.ONLINE) {
    const gatewayOrder = await createGatewayOrder(order);
    order.razorpayOrderId = gatewayOrder.id;
  }
  await saveOrder(order);
  if (order.status === ORDER_STATUS.CONFIRMED) await notifyOrder(order.id);
  return publicOrder(findOrder(order.id) || order);
}

export async function confirmPayment(payload) {
  const orderId = typeof payload.orderId === 'string' ? payload.orderId : '';
  const order = findOrder(orderId);
  if (!order) throw new HttpError(404, 'Order not found');

  // Two simultaneous callbacks for one order must not both run verification.
  if (confirmationsInFlight.has(orderId)) {
    throw new HttpError(409, 'Payment verification already in progress');
  }
  confirmationsInFlight.add(orderId);
  try {
    const captured = await verifyGatewayPayment(order, payload);
    const paidOrder = {
      ...order,
      status: ORDER_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.PAID,
      paymentId: captured.id,
      paidAt: new Date().toISOString(),
    };
    await saveOrder(paidOrder);
    await notifyOrder(paidOrder.id);
    return publicOrder(findOrder(paidOrder.id) || paidOrder);
  } finally {
    confirmationsInFlight.delete(orderId);
  }
}

/** The only shape ever sent to the browser: no customer details, no internal fields. */
function publicOrder(order) {
  const online = order.paymentMethod === PAYMENT_METHOD.ONLINE;
  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    currency: order.currency,
    razorpayOrderId: order.razorpayOrderId ?? null,
    keyId: online ? paymentConfig().razorpayKeyId : null,
  };
}
