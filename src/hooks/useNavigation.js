import { ROUTE, FILTER } from '../constants/index.js';
import { useCallback, useEffect, useState } from 'react';

const pages = new Set([ROUTE.SHOP, ROUTE.WISHLIST, ROUTE.CHECKOUT, ROUTE.HELP]);

/** This function is used for reading the page, category and search from a shareable URL. */
function readRoute() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const params = new URLSearchParams(window.location.search);
  return {
    page: path ? (pages.has(path) ? path : ROUTE.NOT_FOUND) : ROUTE.HOME,
    category: params.get('category') || FILTER.ALL,
    search: (params.get('q') || '').slice(0, 200),
  };
}

/** This function is used for synchronising storefront navigation with browser history. */
export default function useNavigation() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const handleBack = () => {
      setRoute(readRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  }, []);

  const changeRoute = useCallback((next, scroll = true) => {
    const params = new URLSearchParams();
    if (next.category !== FILTER.ALL) params.set('category', next.category);
    if (next.search) params.set('q', next.search);
    const url = `${next.page === ROUTE.HOME ? '/' : `/${next.page}`}${params.size ? `?${params}` : ''}`;
    if (url !== `${window.location.pathname}${window.location.search}`)
      window.history.pushState(null, '', url);
    setRoute(next);
    if (scroll) window.scrollTo(0, 0);
  }, []);

  const navigate = useCallback(
    (page, category = FILTER.ALL) => changeRoute({ page, category, search: '' }),
    [changeRoute],
  );
  const setCategory = useCallback(
    (category) => changeRoute({ ...route, category }, false),
    [changeRoute, route],
  );
  const searchProducts = useCallback(
    (query) =>
      changeRoute({ page: ROUTE.SHOP, category: FILTER.ALL, search: query.trim().slice(0, 200) }),
    [changeRoute],
  );
  return { ...route, navigate, setCategory, searchProducts };
}
