import { TEXT } from '../constants/text.js';
import { ROUTE, PAYMENT_METHOD, PAYMENT_STATUS } from '../constants/index.js';
import { useEffect, useRef, useState } from 'react';
import OrderSummary from '../components/checkout/OrderSummary';
import ShippingFields from '../components/checkout/ShippingFields';
import { emptyCustomer } from '../components/checkout/checkoutFields';
import { STORE_NAME } from '../config/storeRules';
import { useStore } from '../context/StoreContext';
import { api, loadRazorpay, submitOrder } from '../services/api';
import { money } from '../utils/cart';

/** This function is used for collecting shipping details and confirming a server-verified order. */
export default function Checkout({ navigate }) {
  const { cart, subtotal, clear } = useStore();
  const [customer, setCustomer] = useState(emptyCustomer);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHOD.COD);
  const [onlineEnabled, setOnlineEnabled] = useState(false);
  const [busy, setBusyState] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  // A ref (not state) guards against double submits: state only updates after the next render,
  // so two fast clicks could both pass an `if (busy)` check.
  const busyRef = useRef(false);
  function setBusy(value) {
    busyRef.current = value;
    setBusyState(value);
  }

  useEffect(() => {
    let cancelled = false; // ignore the response if the page was left (also covers StrictMode's double effect)
    api('/config')
      .then((config) => !cancelled && setOnlineEnabled(config.razorpayEnabled))
      .catch((configError) => !cancelled && setError(configError.message));
    return () => {
      cancelled = true;
    };
  }, []);

  function updateCustomer(field, value) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  async function payOnline(order) {
    await loadRazorpay();
    const gateway = new window.Razorpay({
      key: order.keyId,
      order_id: order.razorpayOrderId,
      amount: order.total * 100,
      currency: order.currency,
      name: STORE_NAME,
      prefill: { name: customer.name, email: customer.email, contact: customer.phone },
      handler: async (payment) => {
        try {
          const result = await api('/payments/verify', {
            method: 'POST',
            body: JSON.stringify({ ...payment, orderId: order.id }),
          });
          setReceipt({ ...order, ...result });
          clear();
        } catch (paymentError) {
          setError(`Payment needs verification: ${paymentError.message}. Order ID: ${order.id}`);
        } finally {
          setBusy(false);
        }
      },
      modal: {
        ondismiss: () => {
          setError(`Payment not completed. Pending order ID: ${order.id}`);
          setBusy(false);
        },
      },
    });
    gateway.on('payment.failed', () => setError(`Payment failed. Order ID: ${order.id}`));
    gateway.open();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busyRef.current) return;
    setBusy(true);
    setError('');

    try {
      const order = await submitOrder(customer, cart, paymentMethod);
      if (paymentMethod === PAYMENT_METHOD.COD) {
        setReceipt(order);
        clear();
        setBusy(false);
      } else {
        // Stay "busy" while the Razorpay popup is open; its callbacks release the lock.
        await payOnline(order);
      }
    } catch (submitError) {
      console.error('[checkout] submit failed:', submitError);
      setError(submitError.message);
      setBusy(false);
    }
  }

  if (receipt) {
    const paid = receipt.paymentStatus === PAYMENT_STATUS.PAID;
    return (
      <main className="container checkout-page">
        <div className="success-panel" role="status">
          <h1>{paid ? 'Payment successful' : 'Order confirmed'}!</h1>
          <p>
            Order ID: <strong>{receipt.id}</strong>
          </p>
          <p>
            Total: <strong>{money(receipt.total)}</strong>
          </p>
          <p>
            Payment: <strong>{paid ? 'Paid online' : 'Cash on delivery'}</strong>
          </p>
          <p>Keep this order reference for any follow-up.</p>
          <button className="primary dark" onClick={() => navigate(ROUTE.SHOP)}>
            {TEXT.CONTINUE_SHOPPING}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container checkout-page">
      <button className="text-link" onClick={() => navigate(ROUTE.SHOP)}>
        {TEXT.KEEP_SHOPPING}
      </button>
      <h1>
        Secure checkout<span className="period">.</span>
      </h1>
      {!cart.length ? (
        <p>{TEXT.EMPTY_CHECKOUT}</p>
      ) : (
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <h2>{TEXT.SHIPPING_ADDRESS}</h2>
            <p className="muted">
              Delivery to Indian PIN codes. Check your details before ordering.
            </p>
            <ShippingFields customer={customer} onChange={updateCustomer} />
            <h2>{TEXT.PAYMENT_METHOD}</h2>
            <div className="payment-options">
              <label>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === PAYMENT_METHOD.COD}
                  onChange={() => setPaymentMethod(PAYMENT_METHOD.COD)}
                />
                Cash on Delivery (COD)
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === PAYMENT_METHOD.ONLINE}
                  disabled={!onlineEnabled}
                  onChange={() => setPaymentMethod(PAYMENT_METHOD.ONLINE)}
                />
                Pay online with Razorpay {!onlineEnabled && <small>(currently unavailable)</small>}
              </label>
            </div>
            {error && (
              <div className="checkout-error" role="alert">
                {error}
              </div>
            )}
            <button type="submit" className="primary dark full" disabled={busy}>
              {busy
                ? TEXT.PROCESSING
                : paymentMethod === PAYMENT_METHOD.COD
                  ? TEXT.PLACE_COD
                  : TEXT.PAY_ONLINE}
            </button>
            <p className="muted">Review your delivery details before placing your order.</p>
          </form>
          <OrderSummary cart={cart} subtotal={subtotal} />
        </div>
      )}
    </main>
  );
}
