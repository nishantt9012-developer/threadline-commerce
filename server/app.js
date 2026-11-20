import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { HttpError } from './errors.js';
import { readJson, sendJson } from './http.js';
import { confirmPayment, placeOrder } from './orders.js';
import { paymentConfig } from './payments.js';

// route table: path -> HTTP method -> handler returning { status?, body }
const routes = new Map([
  ['/api/health', { GET: () => ({ body: { ok: true } }) }],
  ['/api/config', { GET: () => ({ body: paymentConfig() }) }],
  [
    '/api/orders',
    { POST: async (request) => ({ status: 201, body: await placeOrder(await readJson(request)) }) },
  ],
  [
    '/api/payments/verify',
    { POST: async (request) => ({ body: await confirmPayment(await readJson(request)) }) },
  ],
]);

function parsePathname(rawUrl) {
  try {
    return new URL(rawUrl ?? '/', 'http://localhost').pathname;
  } catch {
    throw new HttpError(400, 'Invalid request URL');
  }
}

async function handle(request, response, logger) {
  const requestId = randomUUID().slice(0, 8);
  const startedAt = performance.now();
  let status = 500;

  try {
    const methods = routes.get(parsePathname(request.url));
    if (!methods) throw new HttpError(404, 'Not found');

    const handler = methods[request.method];
    if (!handler) {
      response.setHeader('Allow', Object.keys(methods).join(', '));
      throw new HttpError(405, 'Method not allowed');
    }

    const result = await handler(request);
    status = result.status ?? 200;
    sendJson(response, status, result.body);
  } catch (error) {
    if (error instanceof HttpError) {
      status = error.status;
      sendJson(response, status, { error: error.message });
    } else {
      // Unknown failure: full detail goes to the server log, the client only gets a reference id.
      logger.error(`[${requestId}] Unexpected API error:`, error);
      sendJson(response, 500, { error: 'Unable to process request', requestId });
    }
  } finally {
    const elapsed = Math.round(performance.now() - startedAt);
    logger.info(
      `[${requestId}] ${request.method} ${String(request.url).slice(0, 100)} -> ${status} (${elapsed}ms)`,
    );
  }
}

/** Builds (but does not start) the HTTP server, so tests can run it on any port. */
export function createApp({ logger = console } = {}) {
  return http.createServer((request, response) => {
    // handle() catches its own errors; this is the last line of defence so the process never dies.
    handle(request, response, logger).catch((error) => {
      logger.error('Fatal error in request handler:', error);
      response.destroy();
    });
  });
}
