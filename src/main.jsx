import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { StoreProvider } from './context/StoreContext';
import './styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing <div id="root"> in index.html');

createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <StoreProvider>
        <App />
      </StoreProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
