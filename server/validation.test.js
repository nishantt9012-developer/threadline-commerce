// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { HttpError } from './errors.js';
import { calculateOrder, validateCustomer } from './validation.js';

const person = {
  name: 'Sample Customer',
  email: 'sample@example.com',
  phone: '9876543210',
  address: '12 Sample Road',
  city: 'Delhi',
  state: 'Delhi',
  pincode: '110001',
};

describe('validateCustomer', () => {
  it('accepts a valid address and trims values', () => {
    const result = validateCustomer({ ...person, name: '  Sample Customer  ' });
    expect(result.name).toBe('Sample Customer');
    expect(result.pincode).toBe('110001');
    expect(result.landmark).toBe('');
  });

  it.each([
    ['invalid PIN', { pincode: '123' }],
    ['invalid mobile', { phone: '1234567890' }],
    ['invalid email', { email: 'nope' }],
    ['missing name', { name: '   ' }],
    ['non-string field', { city: { $gt: '' } }],
    ['over-long landmark', { landmark: 'x'.repeat(500) }],
    ['non-string landmark', { landmark: { a: 1 } }],
  ])('rejects %s with a 400', (_label, patch) => {
    expect(() => validateCustomer({ ...person, ...patch })).toThrow(HttpError);
    try {
      validateCustomer({ ...person, ...patch });
    } catch (error) {
      expect(error.status).toBe(400);
    }
  });

  it('rejects missing / non-object customers', () => {
    expect(() => validateCustomer(undefined)).toThrow(HttpError);
    expect(() => validateCustomer([])).toThrow(HttpError);
  });

  it('drops unknown fields', () => {
    expect(validateCustomer({ ...person, isAdmin: true })).not.toHaveProperty('isAdmin');
  });
});

describe('calculateOrder', () => {
  it('calculates price and shipping on the server', () => {
    const order = calculateOrder([{ productId: 1, size: 'M', quantity: 2 }]);
    expect(order).toMatchObject({ subtotal: 1598, shipping: 99, total: 1697, currency: 'INR' });
  });

  it('gives free shipping at the threshold', () => {
    // 3 x 799 = 2397 >= 1999
    expect(calculateOrder([{ productId: 1, size: 'M', quantity: 3 }]).shipping).toBe(0);
  });

  it('ignores client-supplied prices', () => {
    const order = calculateOrder([{ productId: 1, size: 'M', quantity: 1, price: 1 }]);
    expect(order.total).toBe(898);
  });

  it.each([
    [
      'duplicate lines',
      [
        { productId: 1, size: 'M', quantity: 1 },
        { productId: 1, size: 'M', quantity: 1 },
      ],
    ],
    ['unknown size', [{ productId: 1, size: 'NOPE', quantity: 1 }]],
    ['unknown product', [{ productId: 999, size: 'M', quantity: 1 }]],
    ['zero quantity', [{ productId: 1, size: 'M', quantity: 0 }]],
    ['quantity above max', [{ productId: 1, size: 'M', quantity: 11 }]],
    ['fractional quantity', [{ productId: 1, size: 'M', quantity: 1.5 }]],
    ['string quantity', [{ productId: 1, size: 'M', quantity: '1' }]],
    ['null line (used to be a 500)', [null]],
    ['primitive line', [42]],
    ['empty cart', []],
    ['non-array cart', { productId: 1 }],
  ])('rejects %s with a 400', (_label, cart) => {
    expect(() => calculateOrder(cart)).toThrow(HttpError);
  });
});
