import { TEXT } from '../constants/text.js';
const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message, { status = 0, requestId = null, cause } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    this.status = status;
    this.requestId = requestId;
  }
}

export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch (cause) {
    throw new ApiError(TEXT.NETWORK_ERROR, {
      cause,
    });
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // The Vite proxy answers 5xx with a non-JSON body when the API process is not running.
    const message =
      data?.error ??
      (response.status >= 500 ? TEXT.CHECKOUT_ERROR : `Request failed (${response.status})`);
    const reference = data?.requestId ? ` (ref ${data.requestId})` : '';
    throw new ApiError(message + reference, {
      status: response.status,
      requestId: data?.requestId,
    });
  }
  if (data === null) throw new ApiError(TEXT.INVALID_RESPONSE, { status: response.status });
  return data;
}

export function submitOrder(customer, cart, paymentMethod) {
  // Send only identity, size and quantity. Prices are calculated on the server.
  const items = cart.map(({ productId, size, quantity }) => ({ productId, size, quantity }));
  return api('/orders', {
    method: 'POST',
    body: JSON.stringify({ customer, cart: items, paymentMethod }),
  });
}

let razorpayLoading = null;

/** Loads Razorpay's script once; concurrent calls share one request and a failed load can be retried. */
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (!razorpayLoading) {
    razorpayLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = resolve;
      script.onerror = () => {
        script.remove();
        razorpayLoading = null; // allow a retry
        reject(
          new Error('Could not load the payment gateway. Check your connection and try again.'),
        );
      };
      document.head.appendChild(script);
    });
  }
  return razorpayLoading;
}
