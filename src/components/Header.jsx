import { HEADER_LINKS } from '../constants/navigation';
import { ROUTE, FILTER } from '../constants/index.js';
import { useRef, useState } from 'react';
import { Heart, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD } from '../config/storeRules';
import { useStore } from '../context/StoreContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useEscapeKey } from '../hooks/useEscapeKey';
import useDialogFocus from '../hooks/useDialogFocus';
import { money } from '../utils/cart';
import Brand from './Brand';
import { categories } from '../data/catalog';

const links = HEADER_LINKS;

/** This function is used for navigating collections, searching products and opening saved items or the bag. */
export default function Header({ navigate, onSearch, page, category }) {
  const { count, wishlist, setCartOpen } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const menu = useRef(null);
  const searchButton = useRef(null);
  useEscapeKey(() => setMenuOpen(false), menuOpen);
  useEscapeKey(() => {
    setSearchOpen(false);
    searchButton.current?.focus();
  }, searchOpen);
  useBodyScrollLock(menuOpen);
  useDialogFocus(menu, menuOpen);

  /** This function is used for closing navigation overlays before changing the page. */
  function go(nextPage, nextCategory = FILTER.ALL) {
    setMenuOpen(false);
    setSearchOpen(false);
    navigate(nextPage, nextCategory);
  }

  /** This function is used for sending a catalogue search to the shared shop route. */
  function submitSearch(event) {
    event.preventDefault();
    onSearch(query);
    setSearchOpen(false);
  }

  return (
    <>
      <div className="announcement">
        <span>EVERYDAY, CONSIDERED.</span>
        <p>FREE SHIPPING OVER {money(FREE_SHIPPING_THRESHOLD)}</p>
        <button onClick={() => go(ROUTE.HELP)}>Delivery & care</button>
      </div>
      <header className="header">
        <div className="container header-inner">
          <button
            className="icon-btn mobile-only"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu />
          </button>
          <Brand onClick={() => go(ROUTE.HOME)} />
          <nav className="nav" aria-label="Main navigation">
            {links
              .filter(([label]) =>
                ['Shop All', 'Jeans', 'Cargos', 'Shirts', FILTER.NEW].includes(label),
              )
              .map(([label, nextCategory]) => (
                <a
                  key={nextCategory}
                  href={`/shop${nextCategory === FILTER.ALL ? '' : `?category=${encodeURIComponent(nextCategory)}`}`}
                  aria-current={
                    page === ROUTE.SHOP && category === nextCategory ? 'page' : undefined
                  }
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    event.preventDefault();
                    go(ROUTE.SHOP, nextCategory);
                  }}
                >
                  {label.toUpperCase()}
                </a>
              ))}
          </nav>
          <div className="header-actions">
            <button
              ref={searchButton}
              className="icon-btn"
              aria-label="Search products"
              aria-expanded={searchOpen}
              aria-controls="catalogue-search"
              onClick={() => setSearchOpen((open) => !open)}
            >
              <Search size={21} />
            </button>
            <button
              className="icon-btn wishlist-btn"
              aria-label="View wishlist"
              onClick={() => go(ROUTE.WISHLIST)}
            >
              <Heart size={21} />
              {wishlist.length > 0 && <b>{wishlist.length}</b>}
            </button>
            <button
              className="icon-btn bag-btn"
              aria-label={`Open cart with ${count} items`}
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag size={21} />
              {count > 0 && <b>{count}</b>}
            </button>
          </div>
        </div>
        {searchOpen && (
          <form id="catalogue-search" className="container search-row" onSubmit={submitSearch}>
            <Search size={20} />
            <input
              autoFocus
              aria-label="Search catalogue"
              placeholder="Find your next everyday favourite..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit">Search</button>
            <button
              type="button"
              aria-label="Close search"
              onClick={() => {
                setSearchOpen(false);
                searchButton.current?.focus();
              }}
            >
              <X />
            </button>
          </form>
        )}
        <nav className="container collection-strip" aria-label="Collections">
          {categories.map((c) => (
            <a
              key={c.id}
              href={'/shop?category=' + encodeURIComponent(c.name)}
              aria-current={page === ROUTE.SHOP && category === c.name ? 'page' : undefined}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                go(ROUTE.SHOP, c.name);
              }}
            >
              {c.name}
            </a>
          ))}
        </nav>
      </header>
      {menuOpen && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMenuOpen(false);
          }}
        >
          <aside
            ref={menu}
            className="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="drawer-head">
              <b>EXPLORE THREADLINE</b>
              <button aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                <X />
              </button>
            </div>
            {links.map(([label, nextCategory]) => (
              <button key={nextCategory} onClick={() => go(ROUTE.SHOP, nextCategory)}>
                {label}
              </button>
            ))}
            <button onClick={() => go(ROUTE.WISHLIST)}>Saved for later ({wishlist.length})</button>
            <button onClick={() => go(ROUTE.HELP)}>Customer care</button>
            <p className="drawer-note">A wardrobe for wherever the everyday takes you.</p>
          </aside>
        </div>
      )}
    </>
  );
}
