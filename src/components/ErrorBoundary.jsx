import { Component } from 'react';
import { CART_STORAGE_KEY, WISHLIST_STORAGE_KEY } from '../context/storageKeys';
import { removeKey } from '../utils/storage';

/**
 * Catches render errors anywhere below it so a bug shows a recovery screen
 * instead of a blank white page, and logs full details to the console for debugging.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Render error:', error, info.componentStack);
  }

  resetSavedData = () => {
    // Corrupt persisted data is a classic cause of crash loops on startup.
    removeKey(CART_STORAGE_KEY);
    removeKey(WISHLIST_STORAGE_KEY);
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="container error-fallback" role="alert">
        <h1>Something went wrong.</h1>
        <p>The page hit an unexpected error. Your order data was not changed.</p>
        {import.meta.env.DEV && <pre>{String(error?.stack || error)}</pre>}
        <div className="error-actions">
          <button className="primary dark" onClick={() => window.location.reload()}>
            RELOAD PAGE
          </button>
          <button className="primary light" onClick={this.resetSavedData}>
            CLEAR SAVED BAG &amp; RELOAD
          </button>
        </div>
      </main>
    );
  }
}
