// Frozen enum-style values shared by React and the Node API. Stored values stay backward compatible.
export const ROUTE = Object.freeze({
  HOME: 'home',
  SHOP: 'shop',
  WISHLIST: 'wishlist',
  CHECKOUT: 'checkout',
  HELP: 'help',
  NOT_FOUND: 'not-found',
});
export const FILTER = Object.freeze({
  ALL: 'All',
  TRENDING: 'Trending',
  NEW: 'New Arrivals',
  OFFERS: 'Offers',
});
export const SORT = Object.freeze({
  FEATURED: 'featured',
  PRICE_LOW: 'price-low',
  PRICE_HIGH: 'price-high',
  NAME: 'name',
});
export const PAYMENT_METHOD = Object.freeze({ COD: 'cod', ONLINE: 'razorpay' });
export const ORDER_STATUS = Object.freeze({
  CONFIRMED: 'confirmed',
  PENDING_PAYMENT: 'pending_payment',
});
export const PAYMENT_STATUS = Object.freeze({ PAID: 'paid', UNPAID: 'unpaid' });
export const EMAIL_STATUS = Object.freeze({
  ACCEPTED: 'accepted',
  FAILED: 'failed',
  NOT_CONFIGURED: 'not_configured',
});
