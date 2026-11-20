import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  if (typeof window !== 'undefined') window.history.replaceState(null, '', '/');
  // Server tests run in a Node environment where localStorage does not exist.
  if (typeof localStorage !== 'undefined') localStorage.clear();
});

// jsdom does not implement scrolling; the app calls it on every page change.
if (typeof window !== 'undefined') window.scrollTo = () => {};
