// @vitest-environment node
import { it, expect } from 'vitest';
import { calculateOrder } from './validation.js';
it('accepts catalogue waist variants and rejects a top size for jeans', () => {
  const order = calculateOrder([{ productId: 20, size: '32', quantity: 2, price: 1 }]);
  expect(order.subtotal).toBe(2998);
  expect(() => calculateOrder([{ productId: 20, size: 'M', quantity: 1 }])).toThrow();
});
