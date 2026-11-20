import { TEXT } from '../../constants/text.js';
import { FREE_SHIPPING_THRESHOLD } from '../../config/storeRules';
import { PRODUCT_BY_ID as productById } from '../../data/catalog';
import { money, shippingFor } from '../../utils/cart';

export default function OrderSummary({ cart, subtotal }) {
  const shipping = shippingFor(subtotal);

  return (
    <aside className="order-summary">
      <h2>{TEXT.ORDER_SUMMARY}</h2>
      {cart.map((item) => {
        const product = productById.get(item.productId);
        if (!product) return null;

        return (
          <div className="summary-line" key={item.key}>
            <span>
              {product.name} · {item.size} × {item.quantity}
            </span>
            <strong>{money(product.price * item.quantity)}</strong>
          </div>
        );
      })}
      <div className="summary-line">
        <span>Subtotal</span>
        <strong>{money(subtotal)}</strong>
      </div>
      <div className="summary-line">
        <span>Shipping</span>
        <strong>{shipping ? money(shipping) : 'FREE'}</strong>
      </div>
      <div className="summary-line total">
        <span>Total</span>
        <strong>{money(subtotal + shipping)}</strong>
      </div>
      <p className="muted">Free shipping on orders above {money(FREE_SHIPPING_THRESHOLD)}.</p>
    </aside>
  );
}
