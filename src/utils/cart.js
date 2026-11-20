import {
  FREE_SHIPPING_THRESHOLD,
  MAX_CART_LINES,
  MAX_QUANTITY,
  SHIPPING_FEE,
} from '../config/storeRules.js';

// Pure cart helpers: no React, no DOM. Everything here is unit-tested in tests/cart.test.js.

export function keyFor(productId, size) {
  return `${productId}:${size}`;
}

const clampQuantity = (value) => Math.min(MAX_QUANTITY, Math.floor(value));

export function addItem(items, product, size) {
  if (!product?.sizes?.includes(size)) return items;

  const key = keyFor(product.id, size);
  const existing = items.find((item) => item.key === key);
  if (!existing) {
    return [...items, { key, productId: product.id, size, quantity: 1 }];
  }
  return items.map((item) =>
    item.key === key ? { ...item, quantity: clampQuantity(item.quantity + 1) } : item,
  );
}

export function setQuantity(items, key, quantity) {
  const next = Math.floor(Number(quantity));
  if (!Number.isFinite(next)) return items; // ignore NaN / Infinity instead of corrupting the cart
  if (next <= 0) return items.filter((item) => item.key !== key);
  return items.map((item) =>
    item.key === key ? { ...item, quantity: clampQuantity(next) } : item,
  );
}

/**
 * Turns untrusted data (e.g. localStorage) into a valid cart:
 * drops unknown products/sizes/quantities and merges duplicate product+size lines,
 * because the API rejects duplicate lines.
 */
export function normalizeCart(items, products) {
  if (!Array.isArray(items)) return [];

  const productById = new Map(products.map((product) => [product.id, product]));
  const merged = new Map();

  for (const item of items) {
    const product = productById.get(item?.productId);
    const valid =
      product &&
      product.sizes.includes(item.size) &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0;
    if (!valid) continue;

    const key = keyFor(product.id, item.size);
    const quantity = clampQuantity((merged.get(key)?.quantity ?? 0) + item.quantity);
    merged.set(key, { key, productId: product.id, size: item.size, quantity });
  }
  return [...merged.values()].slice(0, MAX_CART_LINES);
}

export function subtotal(items, products) {
  const productById = new Map(products.map((product) => [product.id, product]));
  return items.reduce(
    (sum, item) => sum + (productById.get(item.productId)?.price ?? 0) * item.quantity,
    0,
  );
}

export function totalCount(items) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function shippingFor(subtotalAmount) {
  return subtotalAmount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export function money(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}
