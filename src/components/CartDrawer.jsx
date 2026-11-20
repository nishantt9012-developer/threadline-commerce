import { TEXT } from '../constants/text.js';
import { ROUTE } from '../constants/index.js';
import { useRef } from 'react';
import useDialogFocus from '../hooks/useDialogFocus';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD, MAX_QUANTITY } from '../config/storeRules';
import { useStore } from '../context/StoreContext';
import { PRODUCT_BY_ID as productById } from '../data/catalog';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { money } from '../utils/cart';

/** This function is used for reviewing the bag, updating quantities and continuing to checkout. */
export default function CartDrawer({ checkout, navigate }) {
  const dialog = useRef(null);
  const { cart, cartOpen, setCartOpen, quantity, remove, subtotal, count } = useStore();

  // Hooks must run on every render, so they come before the early return below.
  useEscapeKey(() => setCartOpen(false), cartOpen);
  useBodyScrollLock(cartOpen);
  useDialogFocus(dialog, cartOpen);
  if (!cartOpen) return null;

  function closeCart() {
    setCartOpen(false);
  }

  function continueShopping() {
    closeCart();
    navigate(ROUTE.SHOP);
  }

  function proceedToCheckout() {
    closeCart();
    checkout();
  }

  return (
    <div
      className="overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeCart();
      }}
    >
      <aside
        ref={dialog}
        className="cart-drawer"
        aria-label="Shopping cart"
        role="dialog"
        aria-modal="true"
      >
        <div className="drawer-head">
          <b>
            YOUR BAG <span>({count})</span>
          </b>
          <button aria-label="Close cart" onClick={closeCart}>
            <X />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag size={42} />
            <h3>{TEXT.EMPTY_CART}</h3>
            <p>Explore the collection and find your fit.</p>
            <button className="primary dark" onClick={continueShopping}>
              {TEXT.CONTINUE_SHOPPING}
            </button>
          </div>
        ) : (
          <>
            <div className="shipping-progress">
              <p>
                {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                  'Your order qualifies for free delivery.'
                ) : (
                  <>
                    You are <strong>{money(FREE_SHIPPING_THRESHOLD - subtotal)}</strong> away from
                    free delivery.
                  </>
                )}
              </p>
              <progress
                aria-label="Free shipping progress"
                max={FREE_SHIPPING_THRESHOLD}
                value={Math.min(subtotal, FREE_SHIPPING_THRESHOLD)}
              />
            </div>
            <div className="cart-list">
              {cart.map((item) => {
                const product = productById.get(item.productId);
                if (!product) return null;

                return (
                  <div className="cart-item" key={item.key}>
                    <img src={product.image} alt={product.name} />
                    <div className="cart-item-info">
                      <h4>{product.name}</h4>
                      <p>
                        SIZE: {item.size} · {product.color}
                      </p>
                      <strong>{money(product.price * item.quantity)}</strong>
                      <div className="qty">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => quantity(item.key, item.quantity - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          aria-label="Increase quantity"
                          disabled={item.quantity >= MAX_QUANTITY}
                          onClick={() => quantity(item.key, item.quantity + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <button
                      className="remove"
                      aria-label={`Remove ${product.name}`}
                      onClick={() => remove(item.key)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="cart-footer">
              <div>
                <span>SUBTOTAL</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <p>Delivery charges are calculated at checkout.</p>
              <button className="primary dark full" onClick={proceedToCheckout}>
                {TEXT.PROCEED_CHECKOUT}
              </button>
              <button className="continue" onClick={closeCart}>
                {TEXT.CONTINUE_SHOPPING}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
