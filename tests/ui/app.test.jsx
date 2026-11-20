import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import ErrorBoundary from '../../src/components/ErrorBoundary';
import { StoreProvider } from '../../src/context/StoreContext';
import { CART_STORAGE_KEY, WISHLIST_STORAGE_KEY } from '../../src/context/storageKeys';

function renderApp() {
  return render(
    <ErrorBoundary>
      <StoreProvider>
        <App />
      </StoreProvider>
    </ErrorBoundary>,
  );
}

const savedCart = () => JSON.parse(localStorage.getItem(CART_STORAGE_KEY));

/** Home page -> open "Relaxed Oxford Shirt" -> pick a size -> add to cart. */
async function addOxfordShirt(user, size = 'M') {
  await user.click(screen.getAllByRole('button', { name: 'Relaxed Oxford Shirt' })[0]);
  const dialog = screen.getByRole('dialog', { name: /Relaxed Oxford Shirt details/ });
  await user.click(within(dialog).getByRole('button', { name: size }));
  await user.click(within(dialog).getByRole('button', { name: /ADD TO CART/ }));
}

async function fillShippingForm(user) {
  const values = {
    'Full name': 'Test Customer',
    Email: 'test@example.com',
    'Mobile number': '9876543210',
    'House / flat, street and area': '12 Test Road',
    City: 'Delhi',
    State: 'Delhi',
    'PIN code': '110001',
  };
  for (const [label, value] of Object.entries(values)) {
    await user.type(screen.getByLabelText(label), value);
  }
}

let user;
beforeEach(() => {
  user = userEvent.setup();
});
afterEach(() => {
  document.body.style.overflow = '';
});

describe('browsing and cart', () => {
  it('renders the home page with consistent branding', () => {
    renderApp();
    expect(screen.getAllByText('THREAD').length).toBeGreaterThanOrEqual(2); // header + footer logo
    expect(screen.getByText(/© 2026 THREADLINE/)).toBeInTheDocument();
    expect(screen.getByText(/FREE SHIPPING OVER ₹1,999/)).toBeInTheDocument();
  });

  it('keeps "Add to cart" disabled until a size is chosen, then adds the item', async () => {
    renderApp();
    await user.click(screen.getAllByRole('button', { name: 'Relaxed Oxford Shirt' })[0]);
    const dialog = screen.getByRole('dialog', { name: /details/ });
    expect(within(dialog).getByRole('button', { name: /ADD TO CART/ })).toBeDisabled();

    await user.click(within(dialog).getByRole('button', { name: 'L' }));
    await user.click(within(dialog).getByRole('button', { name: /ADD TO CART/ }));

    expect(screen.queryByRole('dialog', { name: /details/ })).not.toBeInTheDocument();
    const cart = screen.getByRole('dialog', { name: 'Shopping cart' });
    expect(within(cart).getByText(/SIZE: L/)).toBeInTheDocument();
    expect(savedCart()).toEqual([{ key: '1:L', productId: 1, size: 'L', quantity: 1 }]);
  });

  it('resets the chosen size when a different product is opened', async () => {
    renderApp();
    await user.click(screen.getAllByRole('button', { name: 'Relaxed Oxford Shirt' })[0]);
    await user.click(screen.getByRole('button', { name: 'M' }));
    await user.keyboard('{Escape}');

    await user.click(screen.getAllByRole('button', { name: 'Premium Layered Hoodie' })[0]);
    const dialog = screen.getByRole('dialog', { name: /Premium Layered Hoodie/ });
    expect(within(dialog).getByRole('button', { name: /ADD TO CART/ })).toBeDisabled();
    expect(within(dialog).getByText('Required')).toBeInTheDocument();
  });

  it('closes modal and cart with Escape and releases the page scroll lock', async () => {
    renderApp();
    await user.click(screen.getAllByRole('button', { name: 'Relaxed Oxford Shirt' })[0]);
    expect(document.body.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');

    await user.click(screen.getByRole('button', { name: /Open cart/ }));
    expect(screen.getByRole('dialog', { name: 'Shopping cart' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('updates quantity (max 10) and removes lines', async () => {
    renderApp();
    await addOxfordShirt(user);
    const cart = screen.getByRole('dialog', { name: 'Shopping cart' });

    for (let i = 0; i < 12; i++) {
      const increase = within(cart).getByRole('button', { name: 'Increase quantity' });
      if (!increase.disabled) await user.click(increase);
    }
    expect(savedCart()[0].quantity).toBe(10);
    expect(within(cart).getByRole('button', { name: 'Increase quantity' })).toBeDisabled();

    await user.click(within(cart).getByRole('button', { name: 'Remove Relaxed Oxford Shirt' }));
    expect(within(cart).getByText('Your bag is empty')).toBeInTheDocument();
    expect(savedCart()).toEqual([]);
  });

  it('restores a saved cart after a reload', async () => {
    const first = renderApp();
    await addOxfordShirt(user);
    first.unmount();

    renderApp();
    expect(screen.getByRole('button', { name: 'Open cart with 1 items' })).toBeInTheDocument();
  });

  it('survives corrupted localStorage instead of crashing (regression)', () => {
    localStorage.setItem(CART_STORAGE_KEY, '{definitely not json');
    localStorage.setItem(WISHLIST_STORAGE_KEY, '"nope"');
    renderApp();
    expect(screen.getByRole('button', { name: 'Open cart with 0 items' })).toBeInTheDocument();
  });

  it('merges duplicate saved lines instead of sending them to the API (regression)', () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([
        { productId: 1, size: 'M', quantity: 1 },
        { productId: 1, size: 'M', quantity: 2 },
        { productId: 999, size: 'M', quantity: 1 },
      ]),
    );
    renderApp();
    expect(screen.getByRole('button', { name: 'Open cart with 3 items' })).toBeInTheDocument();
    expect(savedCart()).toHaveLength(1);
  });

  it('toggles the wishlist, labels it correctly, and remembers it', async () => {
    const first = renderApp();
    await user.click(
      screen.getAllByRole('button', { name: 'Add Relaxed Oxford Shirt to wishlist' })[0],
    );
    expect(
      screen.getAllByRole('button', { name: 'Remove Relaxed Oxford Shirt from wishlist' })[0],
    ).toHaveAttribute('aria-pressed', 'true');
    first.unmount();

    renderApp();
    expect(
      screen.getAllByRole('button', { name: 'Remove Relaxed Oxford Shirt from wishlist' }).length,
    ).toBeGreaterThan(0);
  });
});

describe('shop page', () => {
  it('filters by category and searches', async () => {
    renderApp();
    await user.click(screen.getByRole('link', { name: 'SHOP ALL' }));
    expect(screen.getByText(/^18 PRODUCTS/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hoodies' }));
    expect(screen.getByText(/^2 PRODUCTS/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Search products' }));
    await user.type(screen.getByRole('textbox', { name: 'Search catalogue' }), 'linen{Enter}');
    expect(screen.getByText(/^1 PRODUCTS FOR/)).toBeInTheDocument();
    expect(screen.getAllByText('Linen Weekend Shirt').length).toBeGreaterThan(0);
  });

  it('shows an empty state when nothing matches', async () => {
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Search products' }));
    await user.type(screen.getByRole('textbox', { name: 'Search catalogue' }), 'zzzz{Enter}');
    expect(screen.getByText(/No matching products/)).toBeInTheDocument();
  });
});

describe('checkout', () => {
  /** Fake API. `handlers` can override any route; unknown routes fail the test loudly. */
  function mockApi(handlers = {}) {
    const calls = [];
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
    const defaults = {
      'GET /api/config': () => json({ razorpayEnabled: false, razorpayKeyId: '' }),
      'POST /api/orders': () =>
        json(
          {
            id: 'order-123',
            status: 'confirmed',
            paymentStatus: 'unpaid',
            total: 898,
            currency: 'INR',
          },
          201,
        ),
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init = {}) => {
        const route = `${init.method ?? 'GET'} ${url}`;
        calls.push({ route, body: init.body ? JSON.parse(init.body) : null });
        const handler = { ...defaults, ...handlers }[route];
        if (!handler) throw new Error(`Unexpected request: ${route}`);
        return handler();
      }),
    );
    return calls;
  }

  async function goToCheckout() {
    await addOxfordShirt(user);
    await user.click(screen.getByRole('button', { name: 'PROCEED TO CHECKOUT' }));
  }

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); // failures below are expected
  });
  afterEach(() => vi.unstubAllGlobals());

  it('places a COD order, sends no prices, shows the receipt and clears the bag', async () => {
    const calls = mockApi();
    renderApp();
    await goToCheckout();
    await fillShippingForm(user);
    expect(screen.getByText('₹898')).toBeInTheDocument(); // 799 + 99 shipping in the summary

    await user.click(screen.getByRole('button', { name: 'PLACE COD ORDER' }));

    expect(await screen.findByRole('heading', { name: /Order confirmed/ })).toBeInTheDocument();
    expect(screen.getByText('order-123')).toBeInTheDocument();
    const order = calls.find((call) => call.route === 'POST /api/orders').body;
    expect(order.paymentMethod).toBe('cod');
    expect(order.cart).toEqual([{ productId: 1, size: 'M', quantity: 1 }]); // ids + qty only
    expect(savedCart()).toEqual([]);
  });

  it('sends only one request when the form is submitted twice quickly', async () => {
    const calls = mockApi({
      'POST /api/orders': async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return new Response(
          JSON.stringify({ id: 'o1', paymentStatus: 'unpaid', total: 898, currency: 'INR' }),
          { status: 201 },
        );
      },
    });
    renderApp();
    await goToCheckout();
    await fillShippingForm(user);

    const form = screen.getByRole('button', { name: 'PLACE COD ORDER' }).closest('form');
    fireEvent.submit(form);
    fireEvent.submit(form);

    await screen.findByRole('heading', { name: /Order confirmed/ });
    expect(calls.filter((call) => call.route === 'POST /api/orders')).toHaveLength(1);
  });

  describe('with Razorpay enabled', () => {
    let gateway;
    beforeEach(() => {
      gateway = null;
      window.Razorpay = class {
        constructor(options) {
          this.options = options;
          gateway = this;
        }
        on() {}
        open() {}
      };
    });
    afterEach(() => delete window.Razorpay);

    const razorpayOrder = {
      id: 'order-9',
      razorpayOrderId: 'order_RZP',
      keyId: 'rzp_test_key',
      status: 'pending_payment',
      paymentStatus: 'unpaid',
      total: 898,
      currency: 'INR',
    };

    async function openPaymentPopup(extraHandlers = {}) {
      const calls = mockApi({
        'GET /api/config': () =>
          new Response(JSON.stringify({ razorpayEnabled: true, razorpayKeyId: 'rzp_test_key' })),
        'POST /api/orders': () => new Response(JSON.stringify(razorpayOrder), { status: 201 }),
        ...extraHandlers,
      });
      renderApp();
      await goToCheckout();
      await fillShippingForm(user);
      const radio = screen.getByRole('radio', { name: /Pay online with Razorpay/ });
      await waitFor(() => expect(radio).toBeEnabled());
      await user.click(radio);
      await user.click(screen.getByRole('button', { name: 'PROCEED TO SECURE PAYMENT' }));
      await waitFor(() => expect(gateway).not.toBeNull());
      return calls;
    }

    it('keeps the button locked while the payment popup is open, and unlocks if it is dismissed', async () => {
      await openPaymentPopup();
      expect(gateway.options).toMatchObject({
        key: 'rzp_test_key',
        order_id: 'order_RZP',
        amount: 89800,
      });
      // Used to re-enable immediately, letting people create a second order mid-payment.
      expect(screen.getByRole('button', { name: 'PROCESSING…' })).toBeDisabled();

      act(() => gateway.options.modal.ondismiss());
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Payment not completed. Pending order ID: order-9',
      );
      expect(screen.getByRole('button', { name: 'PROCEED TO SECURE PAYMENT' })).toBeEnabled();
      expect(savedCart()).toHaveLength(1); // unpaid => bag is kept
    });

    it('verifies the payment with the server, then shows the paid receipt and clears the bag', async () => {
      const calls = await openPaymentPopup({
        'POST /api/payments/verify': () =>
          new Response(
            JSON.stringify({ ...razorpayOrder, status: 'confirmed', paymentStatus: 'paid' }),
          ),
      });
      await act(() =>
        gateway.options.handler({
          razorpay_payment_id: 'pay_1',
          razorpay_order_id: 'order_RZP',
          razorpay_signature: 'sig',
        }),
      );

      expect(
        await screen.findByRole('heading', { name: /Payment successful/ }),
      ).toBeInTheDocument();
      const verify = calls.find((call) => call.route === 'POST /api/payments/verify').body;
      expect(verify).toMatchObject({ orderId: 'order-9', razorpay_payment_id: 'pay_1' });
      expect(savedCart()).toEqual([]);
    });

    it('keeps the bag and shows the order id when server verification fails', async () => {
      await openPaymentPopup({
        'POST /api/payments/verify': () =>
          new Response(JSON.stringify({ error: 'Payment signature check failed' }), {
            status: 400,
          }),
      });
      await act(() =>
        gateway.options.handler({
          razorpay_payment_id: 'pay_1',
          razorpay_order_id: 'order_RZP',
          razorpay_signature: 'sig',
        }),
      );
      expect(await screen.findByRole('alert')).toHaveTextContent(/signature check failed.*order-9/);
      expect(savedCart()).toHaveLength(1);
    });
  });

  it('shows the server error, keeps the bag, and lets the user retry', async () => {
    mockApi({
      'POST /api/orders': () =>
        new Response(JSON.stringify({ error: 'Enter a valid 6-digit PIN code' }), { status: 400 }),
    });
    renderApp();
    await goToCheckout();
    await fillShippingForm(user);
    await user.click(screen.getByRole('button', { name: 'PLACE COD ORDER' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid 6-digit PIN code');
    expect(screen.getByRole('button', { name: 'PLACE COD ORDER' })).toBeEnabled();
    expect(savedCart()).toHaveLength(1);
  });

  it('explains what to do when the API process is not running (proxy 500 without JSON)', async () => {
    mockApi({ 'POST /api/orders': () => new Response('Internal Server Error', { status: 500 }) });
    renderApp();
    await goToCheckout();
    await fillShippingForm(user);
    await user.click(screen.getByRole('button', { name: 'PLACE COD ORDER' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Checkout is temporarily unavailable/,
    );
  });

  it('includes the reference id when the server reports an unexpected error', async () => {
    mockApi({
      'POST /api/orders': () =>
        new Response(
          JSON.stringify({ error: 'Unable to process request', requestId: 'ab12cd34' }),
          {
            status: 500,
          },
        ),
    });
    renderApp();
    await goToCheckout();
    await fillShippingForm(user);
    await user.click(screen.getByRole('button', { name: 'PLACE COD ORDER' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('ref ab12cd34');
  });

  it('reports a failed config request without blocking COD', async () => {
    mockApi({
      'GET /api/config': () => {
        throw new TypeError('Failed to fetch');
      },
    });
    renderApp();
    await goToCheckout();
    expect(await screen.findByRole('alert')).toHaveTextContent(/Cannot reach the server/);
    expect(screen.getByRole('button', { name: 'PLACE COD ORDER' })).toBeEnabled();
  });

  it('shows an empty-cart message instead of a broken form', async () => {
    mockApi();
    renderApp();
    await goToCheckout();
    await user.click(screen.getByRole('button', { name: /Open cart/ }));
    await user.click(screen.getByRole('button', { name: 'Remove Relaxed Oxford Shirt' }));
    await user.keyboard('{Escape}');

    expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'PLACE COD ORDER' })).not.toBeInTheDocument();
  });

  it('reports a network failure while placing the order', async () => {
    mockApi({
      'POST /api/orders': () => {
        throw new TypeError('Failed to fetch');
      },
    });
    renderApp();
    await goToCheckout();
    await fillShippingForm(user);
    await user.click(screen.getByRole('button', { name: 'PLACE COD ORDER' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Cannot reach the server/);
    expect(screen.getByRole('button', { name: 'PLACE COD ORDER' })).toBeEnabled();
  });
});

describe('ErrorBoundary', () => {
  it('shows a recovery screen instead of a blank page when rendering crashes', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Broken() {
      throw new Error('boom');
    }
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'RELOAD PAGE' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CLEAR SAVED BAG/ })).toBeInTheDocument();
    expect(log).toHaveBeenCalledWith(
      '[ErrorBoundary] Render error:',
      expect.any(Error),
      expect.any(String),
    );
  });
});
