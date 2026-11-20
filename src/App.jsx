import { PAGE_TITLES } from './constants/text.js';
import { ROUTE, FILTER } from './constants/index.js';
import { useCallback, useEffect, useState } from 'react';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import Header from './components/Header';
import ProductModal from './components/ProductModal';
import Checkout from './pages/Checkout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Help from './pages/Help';
import useNavigation from './hooks/useNavigation';

/** This function is used for rendering the current storefront page and shared shopping overlays. */
export default function App() {
  const { page, category, search, navigate, setCategory, searchProducts } = useNavigation();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const closeProduct = useCallback(() => setSelectedProduct(null), []);
  const goToCheckout = useCallback(() => navigate(ROUTE.CHECKOUT), [navigate]);

  useEffect(() => {
    const title =
      page === ROUTE.SHOP
        ? search
          ? `Search: ${search}`
          : category === FILTER.ALL
            ? PAGE_TITLES.shop
            : category
        : PAGE_TITLES[page];
    document.title = `${title || 'Page not found'} | Threadline`;
  }, [page, category, search]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header navigate={navigate} onSearch={searchProducts} page={page} category={category} />
      <div id="main-content" tabIndex={-1}>
        {page === ROUTE.SHOP || page === ROUTE.WISHLIST ? (
          <Shop
            key={page}
            category={category}
            setCategory={setCategory}
            search={search}
            onOpen={setSelectedProduct}
            navigate={navigate}
            wishlistOnly={page === ROUTE.WISHLIST}
          />
        ) : page === ROUTE.CHECKOUT ? (
          <Checkout navigate={navigate} />
        ) : page === ROUTE.HELP ? (
          <Help navigate={navigate} />
        ) : page === ROUTE.HOME ? (
          <Home navigate={navigate} onOpen={setSelectedProduct} />
        ) : (
          <main className="container empty-page">
            <p className="eyebrow">PAGE NOT FOUND</p>
            <h1>A different direction.</h1>
            <p>The page you are looking for isn&apos;t here.</p>
            <button className="primary dark" onClick={() => navigate(ROUTE.HOME)}>
              Back to Threadline
            </button>
          </main>
        )}
      </div>
      <Footer navigate={navigate} />
      <CartDrawer navigate={navigate} checkout={goToCheckout} />
      <ProductModal product={selectedProduct} onClose={closeProduct} />
    </>
  );
}
