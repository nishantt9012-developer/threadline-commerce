import { SHOP_FILTERS } from '../constants/navigation';
import { TEXT } from '../constants/text.js';
import { ROUTE, FILTER, SORT } from '../constants/index.js';
import { useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { audiences, products, PRODUCT_SIZES } from '../data/catalog';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import { money } from '../utils/cart';

const filters = SHOP_FILTERS;
const prices = products.map((product) => product.price);
const PRICE_FLOOR = Math.floor(Math.min(...prices) / 100) * 100;
const PRICE_CEILING = Math.ceil(Math.max(...prices) / 100) * 100;

/** This function is used for filtering, sorting and searching the collection or saved products. */
export default function Shop({
  category,
  setCategory,
  search,
  onOpen,
  navigate,
  wishlistOnly = false,
}) {
  const [audience, setAudience] = useState('men');
  const [sizeFilter, setSizeFilter] = useState(FILTER.ALL);
  const [sort, setSort] = useState(SORT.FEATURED);
  const [maximumPrice, setMaximumPrice] = useState(PRICE_CEILING);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { wishlist } = useStore();
  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesAudience = product.audience === audience || product.audience === 'unisex';
      const matchesCategory =
        category === FILTER.ALL ||
        (category === FILTER.TRENDING && product.tags.includes('trending')) ||
        (category === FILTER.NEW && product.tags.includes('new')) ||
        (category === FILTER.OFFERS && product.tags.includes('offers')) ||
        product.category === category;
      const matchesSearch = `${product.name} ${product.category} ${product.color}`
        .toLowerCase()
        .includes(query);
      return (
        matchesAudience &&
        matchesCategory &&
        matchesSearch &&
        product.price <= maximumPrice &&
        (sizeFilter === FILTER.ALL || product.sizes.includes(sizeFilter)) &&
        (!wishlistOnly || wishlist.includes(product.id))
      );
    });
    return filtered.sort((a, b) =>
      sort === SORT.PRICE_LOW
        ? a.price - b.price
        : sort === SORT.PRICE_HIGH
          ? b.price - a.price
          : sort === SORT.NAME
            ? a.name.localeCompare(b.name)
            : a.id - b.id,
    );
  }, [audience, category, maximumPrice, search, sizeFilter, sort, wishlist, wishlistOnly]);

  /** This function is used for clearing the collection filters without losing saved products. */
  function clearFilters() {
    setMaximumPrice(PRICE_CEILING);
    setSort(SORT.FEATURED);
    setSizeFilter(FILTER.ALL);
    setCategory(FILTER.ALL);
    if (search) navigate(wishlistOnly ? ROUTE.WISHLIST : ROUTE.SHOP);
  }

  return (
    <main className="container shop-page">
      <div className="shop-breadcrumb">
        <button onClick={() => navigate(ROUTE.HOME)}>Home</button>
        <span>/</span>
        <span>{wishlistOnly ? 'Saved for later' : 'The collection'}</span>
      </div>
      <div className="shop-heading">
        <p className="eyebrow">
          {wishlistOnly ? 'YOUR PERSONAL ROTATION' : 'EVERYDAY, CONSIDERED.'}
        </p>
        <h1>
          {wishlistOnly
            ? 'Saved for later'
            : search
              ? 'Find your favourites'
              : category === FILTER.ALL
                ? 'The collection'
                : category}
          <span className="period">.</span>
        </h1>
        <p>
          {wishlistOnly
            ? 'The pieces that caught your eye. Kept together, just for you.'
            : 'From oversized tees to denim, cargos and easy layers. Find your whole rotation.'}
        </p>
        <div className="audience-tabs" aria-label="Shop by collection">
          {audiences
            .filter((option) => !option.comingSoon)
            .map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={audience === option.id}
                className={audience === option.id ? 'selected' : ''}
                onClick={() => setAudience(option.id)}
              >
                {option.label}
              </button>
            ))}
        </div>
      </div>
      <div className="shop-layout">
        <aside
          id="product-filters"
          className={`filters${filtersOpen ? ' is-open' : ''}`}
          aria-label="Product filters"
        >
          <div className="filter-heading">
            <span className="filter-title">EXPLORE</span>
            <SlidersHorizontal size={17} />
          </div>
          {filters.map((option) => (
            <button
              key={option}
              className={`filter-option ${category === option ? 'selected' : ''}`}
              aria-pressed={category === option}
              onClick={() => setCategory(option)}
            >
              <span>{option === FILTER.ALL ? 'All pieces' : option}</span>
              {category === option && <span className="filter-indicator" />}
            </button>
          ))}
          <label className="filter-subtitle" htmlFor="price-filter">
            MAX PRICE <span>{money(maximumPrice)}</span>
          </label>
          <input
            id="price-filter"
            type="range"
            min={PRICE_FLOOR}
            max={PRICE_CEILING}
            step="100"
            value={maximumPrice}
            onChange={(event) => setMaximumPrice(Number(event.target.value))}
          />
          <label className="filter-subtitle" htmlFor="size-filter">
            AVAILABLE SIZE
          </label>
          <select
            id="size-filter"
            className="size-filter"
            value={sizeFilter}
            onChange={(event) => setSizeFilter(event.target.value)}
          >
            {[FILTER.ALL, ...PRODUCT_SIZES].map((size) => (
              <option key={size} value={size}>
                {size === FILTER.ALL ? 'All sizes' : size}
              </option>
            ))}
          </select>
          <button className="clear-filters" onClick={clearFilters}>
            {TEXT.RESET_FILTERS}
          </button>
        </aside>
        <section aria-label="Products">
          <div className="mobile-filter">
            <label htmlFor="category-select">Collection</label>
            <select
              id="category-select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {filters.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <button
              className="refine-button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-controls="product-filters"
            >
              {filtersOpen ? <X size={16} /> : <SlidersHorizontal size={16} />} Filters
            </button>
          </div>
          <div className="results-bar">
            <span>
              {visibleProducts.length} PRODUCTS {search ? `FOR “${search}”` : ''}
            </span>
            <label>
              SORT BY{' '}
              <select
                aria-label="Sort products"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value={SORT.FEATURED}>Featured</option>
                <option value={SORT.PRICE_LOW}>Price: low to high</option>
                <option value={SORT.PRICE_HIGH}>Price: high to low</option>
                <option value={SORT.NAME}>Name A–Z</option>
              </select>
            </label>
          </div>
          {visibleProducts.length ? (
            <div className="product-grid shop-grid">
              {visibleProducts.map((product, index) => (
                <div key={product.id} style={{ '--card-index': index }}>
                  <ProductCard product={product} onOpen={onOpen} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="eyebrow">
                {wishlistOnly ? 'A LITTLE ROOM FOR FAVOURITES' : 'LET’S TRY ANOTHER ANGLE'}
              </p>
              <h2>
                {wishlistOnly && !wishlist.length
                  ? 'Your next favourite is out there.'
                  : 'No matching products.'}
              </h2>
              <p>
                {wishlistOnly && !wishlist.length
                  ? 'Tap the heart on a product to save it here.'
                  : 'Try a different category or search.'}
              </p>
              <button
                className="primary dark"
                onClick={
                  wishlistOnly && !wishlist.length ? () => navigate(ROUTE.SHOP) : clearFilters
                }
              >
                {wishlistOnly && !wishlist.length ? 'Explore the collection' : TEXT.CLEAR_FILTERS}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
