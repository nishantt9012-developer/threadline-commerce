/* eslint-disable react-refresh/only-export-components -- provider and hook intentionally live together */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { products, PRODUCT_BY_ID } from '../data/catalog';
import { addItem, normalizeCart, setQuantity, subtotal, totalCount } from '../utils/cart';
import { loadJson, saveJson } from '../utils/storage';
import { CART_STORAGE_KEY, WISHLIST_STORAGE_KEY } from './storageKeys';

const StoreContext = createContext(null);

const readSavedCart = () => normalizeCart(loadJson(CART_STORAGE_KEY, []), products);

function readSavedWishlist() {
  const saved = loadJson(WISHLIST_STORAGE_KEY, []);
  if (!Array.isArray(saved)) return [];
  return saved.filter((id) => PRODUCT_BY_ID.has(id));
}

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(readSavedCart);
  const [wishlist, setWishlist] = useState(readSavedWishlist);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => saveJson(CART_STORAGE_KEY, cart), [cart]);
  useEffect(() => saveJson(WISHLIST_STORAGE_KEY, wishlist), [wishlist]);

  // Actions use functional updates and have no dependencies, so their identity never changes.
  const add = useCallback((product, size) => {
    if (!product?.sizes?.includes(size)) return; // never open the cart for an invalid size
    setCart((current) => addItem(current, product, size));
    setCartOpen(true);
  }, []);

  const quantity = useCallback((key, amount) => {
    setCart((current) => setQuantity(current, key, amount));
  }, []);

  const remove = useCallback((key) => {
    setCart((current) => current.filter((item) => item.key !== key));
  }, []);

  const clear = useCallback(() => setCart([]), []);

  const toggleWish = useCallback((productId) => {
    setWishlist((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }, []);

  // Totals are derived from the cart, never stored separately (so they can't drift out of sync).
  const value = useMemo(
    () => ({
      cart,
      wishlist,
      cartOpen,
      setCartOpen,
      add,
      quantity,
      remove,
      clear,
      toggleWish,
      count: totalCount(cart),
      subtotal: subtotal(cart, products),
    }),
    [cart, wishlist, cartOpen, add, quantity, remove, clear, toggleWish],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used inside <StoreProvider>');
  return context;
}
