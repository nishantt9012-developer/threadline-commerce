import { describe, expect, it } from 'vitest';
import {
  addItem,
  money,
  normalizeCart,
  setQuantity,
  shippingFor,
  subtotal,
  totalCount,
} from '../src/utils/cart.js';

const product = { id: 1, sizes: ['M', 'L'], price: 599 };
const products = [product];

describe('addItem', () => {
  it('requires a valid size', () => {
    expect(addItem([], product, 'XXL')).toEqual([]);
    expect(addItem([], undefined, 'M')).toEqual([]);
  });

  it('increments the same product+size and keeps other sizes separate', () => {
    let cart = addItem([], product, 'M');
    cart = addItem(cart, product, 'M');
    cart = addItem(cart, product, 'L');
    expect(cart).toHaveLength(2);
    expect(cart[0].quantity).toBe(2);
    expect(totalCount(cart)).toBe(3);
    expect(subtotal(cart, products)).toBe(1797);
  });

  it('never exceeds the maximum quantity', () => {
    let cart = [];
    for (let i = 0; i < 15; i++) cart = addItem(cart, product, 'M');
    expect(cart[0].quantity).toBe(10);
  });
});

describe('setQuantity', () => {
  const cart = addItem([], product, 'M');

  it('caps at 10 and removes at 0 or below', () => {
    expect(setQuantity(cart, '1:M', 99)[0].quantity).toBe(10);
    expect(setQuantity(cart, '1:M', 0)).toEqual([]);
    expect(setQuantity(cart, '1:M', -3)).toEqual([]);
  });

  it('ignores NaN instead of corrupting the cart (regression)', () => {
    expect(setQuantity(cart, '1:M', NaN)).toEqual(cart);
    expect(setQuantity(cart, '1:M', undefined)).toEqual(cart);
  });

  it('floors fractional quantities', () => {
    expect(setQuantity(cart, '1:M', 2.9)[0].quantity).toBe(2);
  });
});

describe('normalizeCart (untrusted localStorage data)', () => {
  it('ignores non-arrays and garbage', () => {
    expect(normalizeCart(null, products)).toEqual([]);
    expect(normalizeCart({}, products)).toEqual([]);
    expect(normalizeCart([null, 5, 'x'], products)).toEqual([]);
  });

  it('drops unknown products, bad sizes and bad quantities', () => {
    const saved = [
      { productId: 8, size: 'M', quantity: 9 },
      { productId: 1, size: 'XXL', quantity: 1 },
      { productId: 1, size: 'M', quantity: 0 },
      { productId: 1, size: 'M', quantity: 1.5 },
    ];
    expect(normalizeCart(saved, products)).toEqual([]);
  });

  it('merges duplicate lines, because the API rejects duplicates (regression)', () => {
    const saved = [
      { productId: 1, size: 'M', quantity: 1 },
      { productId: 1, size: 'M', quantity: 2 },
    ];
    expect(normalizeCart(saved, products)).toEqual([
      { key: '1:M', productId: 1, size: 'M', quantity: 3 },
    ]);
  });

  it('caps merged quantity at 10', () => {
    const saved = [
      { productId: 1, size: 'M', quantity: 8 },
      { productId: 1, size: 'M', quantity: 8 },
    ];
    expect(normalizeCart(saved, products)[0].quantity).toBe(10);
  });
});

describe('pricing helpers', () => {
  it('charges shipping below the free-shipping threshold only', () => {
    expect(shippingFor(1998)).toBe(99);
    expect(shippingFor(1999)).toBe(0);
  });

  it('formats rupees with Indian grouping', () => {
    expect(money(1234567)).toBe('₹12,34,567');
    expect(money(undefined)).toBe('₹0');
  });
});
