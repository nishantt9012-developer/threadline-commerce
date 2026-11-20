// Compatibility entry point: one Vite process serves both the UI and the local order API.
import { createServer, preview } from 'vite';
if (process.argv.includes('--preview')) {
  const server = await preview({ preview: { host: '0.0.0.0' } });
  server.printUrls();
} else {
  const server = await createServer({ server: { host: '0.0.0.0' } });
  await server.listen();
  server.printUrls();
}
