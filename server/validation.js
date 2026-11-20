import { PRODUCT_BY_ID as productById } from '../src/data/catalog.js';
import {
  CUSTOMER_FIELD_LIMITS,
  CURRENCY,
  MAX_CART_LINES,
  MAX_QUANTITY,
} from '../src/config/storeRules.js';
import { shippingFor } from '../src/utils/cart.js';
import { badRequest } from './errors.js';

const REQUIRED_FIELDS = ['name', 'email', 'phone', 'address', 'city', 'state', 'pincode'];

function isText(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

export function validateCustomer(customer) {
  if (!customer || typeof customer !== 'object' || Array.isArray(customer)) {
    throw badRequest('Customer details are required');
  }

  for (const field of REQUIRED_FIELDS) {
    if (!isText(customer[field], CUSTOMER_FIELD_LIMITS[field])) {
      throw badRequest(`Valid ${field} is required`);
    }
  }
  // Landmark is optional, but if present it must still be a sane string.
  const landmark = customer.landmark ?? '';
  if (typeof landmark !== 'string' || landmark.trim().length > CUSTOMER_FIELD_LIMITS.landmark) {
    throw badRequest('Valid landmark is required');
  }

  const clean = Object.fromEntries(
    [...REQUIRED_FIELDS, 'landmark'].map((field) => [field, String(customer[field] ?? '').trim()]),
  );

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) throw badRequest('Invalid email address');
  if (!/^[6-9]\d{9}$/.test(clean.phone)) throw badRequest('Enter a valid Indian mobile number');
  if (!/^\d{6}$/.test(clean.pincode)) throw badRequest('Enter a valid 6-digit PIN code');
  return clean;
}

export function calculateOrder(cart) {
  if (!Array.isArray(cart) || cart.length === 0 || cart.length > MAX_CART_LINES) {
    throw badRequest('Cart is empty or too large');
  }

  const seen = new Set();
  const items = cart.map((line) => {
    // Prices from the client are ignored on purpose: only id, size and quantity are read.
    const { productId, size, quantity } = line && typeof line === 'object' ? line : {};
    const product = productById.get(productId);
    const valid =
      product &&
      product.sizes.includes(size) &&
      Number.isInteger(quantity) &&
      quantity >= 1 &&
      quantity <= MAX_QUANTITY;
    if (!valid) throw badRequest('Invalid cart item');

    const variant = `${productId}:${size}`;
    if (seen.has(variant)) throw badRequest('Duplicate cart item');
    seen.add(variant);

    return {
      productId,
      name: product.name,
      size,
      quantity,
      unitPrice: product.price,
      lineTotal: product.price * quantity,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shipping = shippingFor(subtotal);
  return { items, subtotal, shipping, total: subtotal + shipping, currency: CURRENCY };
}
