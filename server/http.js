import { HttpError, badRequest } from './errors.js';

const MAX_BODY_BYTES = 25_000;

export function sendJson(response, status, payload) {
  if (response.headersSent) return;
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(payload));
}

/**
 * Reads a JSON object body. The stream is always drained (never abandoned half-read),
 * otherwise Node would destroy the socket and the client would never see our error response.
 */
export function readJson(request, limit = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;

    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        tooLarge = true;
        chunks.length = 0;
      } else if (!tooLarge) {
        chunks.push(chunk);
      }
    });
    request.on('error', reject);
    request.on('end', () => {
      if (tooLarge) return reject(new HttpError(413, 'Request body too large'));

      let parsed;
      try {
        parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        return reject(badRequest('Invalid JSON'));
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return reject(badRequest('Request body must be a JSON object'));
      }
      return resolve(parsed);
    });
  });
}
