import { ROUTE, FILTER } from '../constants/index.js';
import { RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { categories, products } from '../data/catalog';

/** This function is used for displaying a curated product row and its related collection. */
function ProductSection({
  title,
  description,
  items,
  onShowMore,
  onOpen,
  label = 'THE CURRENT ROTATION',
}) {
  return (
    <section className="section container">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{label}</p>
          <h2>
            {title}
            <span className="period">.</span>
          </h2>
          <p className="muted">{description}</p>
        </div>
        <button className="text-link" onClick={onShowMore}>
          View the collection
        </button>
      </div>
      <div className={`product-grid${Math.min(items.length, 4) === 3 ? ' three-products' : ''}`}>
        {items.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

/** This function is used for introducing Threadline through campaign imagery and shoppable collections. */
export default function Home({ navigate, onOpen }) {
  return (
    <main>
      <section className="hero">
        <img
          className="hero-image"
          src="/images/threadline-campaign.jpg"
          alt="Men wearing a white shirt and charcoal hoodie in a contemporary urban setting"
          width="1536"
          height="1024"
        />
        <div className="hero-shade" />
        <div className="hero-content container">
          <p className="hero-kicker">EVERYDAY, CONSIDERED.</p>
          <h1>
            Less noise.
            <br />
            <em>More you.</em>
          </h1>
          <p>
            The pieces you reach for.
            <br />
            For wherever the everyday takes you.
          </p>
          <div className="hero-actions">
            <button className="primary light" onClick={() => navigate(ROUTE.SHOP)}>
              Explore collection
            </button>
            <button className="hero-secondary" onClick={() => navigate(ROUTE.SHOP, 'Shirts')}>
              Discover shirts
            </button>
          </div>
        </div>
        <div className="hero-bottom container">
          <span>GOOD DAYS START WITH A GOOD FIT.</span>
          <button onClick={() => navigate(ROUTE.SHOP, FILTER.NEW)}>
            Discover the new arrivals
          </button>
        </div>
      </section>
      <div className="brand-statement">
        <span>THE EVERYDAY WARDROBE</span>
        <p>
          Fewer decisions. <em>Better rotation.</em>
        </p>
        <span>TOPS. BOTTOMS. LAYERS.</span>
      </div>
      <section className="section container category-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR WARDROBE, SIMPLIFIED</p>
            <h2>
              Find your everyday<span className="period">.</span>
            </h2>
          </div>
          <p className="section-aside">
            Easy layers. A sharper silhouette.
            <br />
            Start with what feels like you.
          </p>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-card category-${category.id}`}
              onClick={() => navigate(ROUTE.SHOP, category.name)}
            >
              <img
                src={category.image}
                alt={`Explore ${category.name.toLowerCase()}`}
                loading="lazy"
              />
              <span className="category-label">
                <span>
                  <small>THE EVERYDAY EDIT</small>
                  <strong>{category.name}</strong>
                </span>
                <span className="category-action">Shop {category.name.toLowerCase()}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
      <ProductSection
        title="The daily rotation"
        description="A few of the pieces bringing it all together."
        items={products.filter((product) => product.tags.includes('trending'))}
        onOpen={onOpen}
        onShowMore={() => navigate(ROUTE.SHOP, FILTER.TRENDING)}
      />
      <section className="editorial">
        <div className="editorial-photo">
          <img
            src="/images/threadline-editorial.jpg"
            alt="A charcoal hoodie styled with relaxed black trousers"
            width="1536"
            height="1024"
            loading="lazy"
          />
        </div>
        <div className="editorial-content">
          <p className="eyebrow">THE ART OF DOING LESS</p>
          <h2>
            Off the clock.
            <br />
            <em>Still on point.</em>
          </h2>
          <p>Some days call for a softer pace. Find your next layer in our everyday hoodie edit.</p>
          <button className="primary dark" onClick={() => navigate(ROUTE.SHOP, 'Hoodies')}>
            Shop the hoodie edit
          </button>
          <span className="editorial-signature">THREADLINE — EVERYDAY, CONSIDERED.</span>
        </div>
      </section>
      <ProductSection
        title="New in the line-up"
        description="A fresh perspective on the everyday wardrobe."
        label="MEET YOUR NEXT FAVOURITES"
        items={products.filter((product) => [21, 22, 28, 30].includes(product.id))}
        onOpen={onOpen}
        onShowMore={() => navigate(ROUTE.SHOP, FILTER.NEW)}
      />
      <section className="sale-banner container">
        <div>
          <p className="eyebrow">GOOD FINDS. BETTER PRICES.</p>
          <h2>
            A little refresh.
            <br />
            <em>A lighter spend.</em>
          </h2>
          <p>Explore reduced-price pieces in the current collection.</p>
        </div>
        <button className="primary light" onClick={() => navigate(ROUTE.SHOP, FILTER.OFFERS)}>
          Explore the offers
        </button>
      </section>
      <div className="benefits container">
        <div>
          <Truck size={25} />
          <span>
            <h3>Delivery, made clear</h3>
            <p>Shipping shown before you order.</p>
          </span>
        </div>
        <div>
          <ShieldCheck size={25} />
          <span>
            <h3>Your size. Your choice.</h3>
            <p>Choose your fit before adding to bag.</p>
          </span>
        </div>
        <div>
          <RotateCcw size={25} />
          <span>
            <h3>A little help, when needed</h3>
            <p>
              <button onClick={() => navigate(ROUTE.HELP)}>Explore customer care</button>
            </p>
          </span>
        </div>
      </div>
    </main>
  );
}
