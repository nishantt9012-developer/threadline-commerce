import { createApp } from '../server/app.js';
import { flushStore, initStore } from '../server/store.js';

/** This function is used for serving the real order API inside local Vite development and preview. */
export default function storeApi() {
  async function attach(server) {
    await initStore();
    const api = createApp().listeners('request')[0];
    server.middlewares.use((request, response, next) => {
      const path = (request.url || '').split('?')[0];
      if (path === '/api' || path.startsWith('/api/')) api(request, response);
      else next();
    });
    server.httpServer?.once('close', () => {
      flushStore().catch((error) =>
        console.error('[store] Could not finish saving orders:', error),
      );
    });
    console.log('[store] Order API ready on the website URL (/api).');
  }
  return {
    name: 'threadline-local-api',
    apply: (_config, environment) => environment.command === 'serve' && environment.mode !== 'test',
    configureServer: attach,
    configurePreviewServer: attach,
  };
}
