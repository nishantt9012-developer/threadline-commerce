/**
 * Business rules shared by the React app AND the API server.
 * Change a value here and both sides stay in agreement - never hard-code these elsewhere.
 * (Keep this file free of browser/Node-only APIs so both environments can import it.)
 */
export const STORE_NAME = 'Threadline';
export const CURRENCY = 'INR';

export const FREE_SHIPPING_THRESHOLD = 1999;
export const SHIPPING_FEE = 99;

export const MAX_QUANTITY = 10; // per cart line
export const MAX_CART_LINES = 40;

// Maximum accepted length of each checkout field (used by <input maxLength> and the API validator).
export const CUSTOMER_FIELD_LIMITS = {
  name: 100,
  email: 120,
  phone: 10,
  address: 200,
  landmark: 120,
  city: 80,
  state: 80,
  pincode: 6,
};
