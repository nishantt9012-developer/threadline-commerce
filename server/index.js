import { createApp } from './app.js';
import { config } from './config.js';
import { flushStore, initStore } from './store.js';

try {
  await initStore();
} catch (error) {
  console.error(`Cannot start API: ${error.message}`);
  process.exit(1);
}

const server = createApp();

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${config.port} is already in use. Stop the other process or set API_PORT.`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

server.listen(config.port, () => {
  console.log(`Store API running at http://localhost:${config.port}`);
  if (!(config.razorpayKeyId && config.razorpayKeySecret)) {
    console.log('Razorpay keys not set: online payments disabled (COD still works).');
  }
});

// A rejected promise nobody awaited must be visible in the log, not silently swallowed.
process.on('unhandledRejection', (reason) => console.error('Unhandled promise rejection:', reason));

async function shutdown(signal) {
  console.log(`${signal} received, finishing pending writes...`);
  server.close();
  server.closeIdleConnections();
  await flushStore().catch(() => {});
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
