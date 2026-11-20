import { TEXT } from '../constants/text.js';
import { Heart, Plus } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { money } from '../utils/cart';

/** This function is used for displaying a product, saving it and opening its size selection. */
export default function ProductCard({ product, onOpen }) {
  const { wishlist, toggleWish } = useStore();
  const isWishlisted = wishlist.includes(product.id);
  return (
    <article className="product-card">
      <div className="product-img">
        <button
          className="product-image-button"
          aria-label={`View ${product.name}`}
          onClick={() => onOpen(product)}
        >
          <img src={product.image} alt={product.name} width="800" height="1200" loading="lazy" />
        </button>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button
          className={`wish ${isWishlisted ? 'active' : ''}`}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={isWishlisted}
          onClick={() => toggleWish(product.id)}
        >
          <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
        <button className="quick-add" onClick={() => onOpen(product)}>
          <Plus size={17} />
          {TEXT.SELECT_SIZE}
        </button>
      </div>
      <div className="product-meta">
        <span>{product.category}</span>
        <span className="colour-meta">
          <i style={{ background: product.colorHex }} aria-hidden="true" />
          {product.color}
        </span>
      </div>
      <button className="product-name-button" onClick={() => onOpen(product)}>
        {product.name}
      </button>
      <div className="prices">
        <strong>{money(product.price)}</strong>
        {product.compareAt > product.price && <del>{money(product.compareAt)}</del>}
      </div>
    </article>
  );
}
