import { TEXT } from '../constants/text.js';
import { useRef, useState } from 'react';
import { Truck, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useEscapeKey } from '../hooks/useEscapeKey';
import useDialogFocus from '../hooks/useDialogFocus';
import { FREE_SHIPPING_THRESHOLD } from '../config/storeRules';
import { money } from '../utils/cart';

/** This function is used for displaying product information and requiring a size before adding to the bag. */
export default function ProductModal({ product, onClose }) {
  const [selection, setSelection] = useState({ productId: null, size: '' });
  const size = selection.productId === product?.id ? selection.size : '';
  const { add } = useStore();
  const dialog = useRef(null);
  useEscapeKey(onClose, Boolean(product));
  useBodyScrollLock(Boolean(product));
  useDialogFocus(dialog, Boolean(product));
  if (!product) return null;

  /** This function is used for adding the selected product and size before closing its details. */
  function addToCart() {
    add(product, size);
    onClose();
  }

  return (
    <div
      className="overlay modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialog}
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${product.name} details`}
      >
        <div className="modal-toolbar">
          <button aria-label="Close product details" className="modal-close" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="modal-photo">
          <img src={product.image} alt={product.name} width="800" height="1200" />
        </div>
        <div className="modal-info">
          <p className="eyebrow">THE {product.category.toUpperCase()} COLLECTION</p>
          <h2>{product.name}</h2>
          <div className="prices">
            <strong>{money(product.price)}</strong>
            {product.compareAt > product.price && <del>{money(product.compareAt)}</del>}
          </div>
          <p className="muted">
            {product.description || 'A considered addition to your everyday rotation.'}
          </p>
          <div className="modal-colour">
            <span>Colour</span>
            <i style={{ background: product.colorHex }} aria-hidden="true" />
            <strong>{product.color}</strong>
          </div>
          <h4>
            {product.sizes.every((option) => /^\d+$/.test(option))
              ? TEXT.SELECT_WAIST
              : TEXT.SELECT_SIZE}{' '}
            <span>{size || TEXT.REQUIRED_SIZE}</span>
          </h4>
          <div className="size-options">
            {product.sizes.map((option) => (
              <button
                key={option}
                className={size === option ? 'chosen' : ''}
                aria-pressed={size === option}
                onClick={() => setSelection({ productId: product.id, size: option })}
              >
                {option}
              </button>
            ))}
          </div>
          <button className="primary dark full" disabled={!size} onClick={addToCart}>
            ADD TO CART — {money(product.price)}
          </button>
          <small>Choose a size to add this item to your bag.</small>
          <div className="modal-delivery">
            <Truck size={20} />
            <span>Free delivery on orders of {money(FREE_SHIPPING_THRESHOLD)} or more.</span>
          </div>
          <details className="product-detail" open>
            <summary>The everyday details</summary>
            <p>
              Part of the Threadline {product.category.toLowerCase()} collection. Available in{' '}
              {product.color.toLowerCase()} and sizes {product.sizes.join(', ')}. Check your
              preferred fit before adding to bag.
            </p>
          </details>
          <details className="product-detail">
            <summary>Delivery & care</summary>
            <p>
              Delivery charges are shown before checkout. Please confirm garment measurements and
              the store&apos;s final care and return terms before purchase.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
