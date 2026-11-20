# Threadline — React commerce starter

A responsive clothing storefront (React 18 + Vite) with a small Node API for orders and Razorpay
payments. Includes **18 demo products across eight menswear categories**; the product model is audience-neutral, so
women's and unisex lines can be added without touching cart or checkout code.

> **Development starter, not a production payment service.** Orders are stored in a local JSON
> file. See [Before going live](#before-going-live).

## Quick start (Node.js 20.12+)

```sh
npm install
npm run dev          # website + local order API (open the printed Local URL)
```

`npm run dev` and `npm run dev:all` run one Vite server with the real local order API built in. Open the printed Local URL and keep the terminal running. No separate API process is required.
Optional: copy `.env.example` to `.env` to enable Razorpay test mode.

| Command              | What it does                                                        |
| -------------------- | ------------------------------------------------------------------- |
| `npm run dev:all`    | Vite with the local order API, stops on Ctrl+C |
| `npm run dev:api`    | API only                                                            |
| `npm test`           | All tests (unit, API integration, React UI)                         |
| `npm run test:watch` | Re-run tests as you edit                                            |
| `npm run lint`       | ESLint (includes React Hooks rules)                                 |
| `npm run format`     | Prettier                                                            |
| `npm run build`      | Production build to `dist/`                                         |
| `npm run check`      | lint + test + build — run before every commit                       |

## Project layout

```
src/
  config/storeRules.js     Shipping fee, free-shipping threshold, max quantity, field limits
                           (imported by BOTH the React app and the API - change once)
  data/catalog.js          Products, categories, audiences - single source of truth
  utils/cart.js            Pure cart maths (no React) - fully unit-tested
  utils/storage.js         Safe localStorage wrappers
  context/                 Cart + wishlist state (StoreContext) and storage keys
  services/api.js          fetch wrapper -> ApiError with readable messages
  hooks/                   useEscapeKey, useBodyScrollLock
  components/              Header, Footer, ProductCard, ProductModal, CartDrawer, ErrorBoundary...
  components/checkout/     Shipping form fields + order summary
  pages/                   Home, Shop, Checkout
server/
  app.js                   Route table + central error handling (createApp - no listening)
  index.js                 Starts the server, graceful shutdown
  config.js                Loads .env, reads settings
  errors.js                HttpError: errors that are safe to show clients
  http.js                  JSON body reading (size limit, object-only)
  validation.js            Address + cart validation, server-side price calculation
  orders.js, payments.js   Order lifecycle, Razorpay create/verify
  store.js                 Dev-only JSON order storage
tests/                     cart unit tests + React UI tests (jsdom)
server/*.test.js           Validation, storage, and real-HTTP API tests
```

## Debugging guide

| Symptom                                        | Cause / fix                                                                                                                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkout says _"API server is not responding"_ | API is not running. Use `npm run dev:all`.                                                                                                                           |
| Checkout says _"Cannot reach the server"_      | Network problem or API stopped. Check the terminal running `dev:all`.                                                                                                |
| Error message ends with `(ref ab12cd34)`       | Unexpected server error. Search the API terminal for `[ab12cd34]` — the full stack trace is there.                                                                   |
| `Port 3001 is already in use`                  | Another API is running. Stop it or set `API_PORT`; development and preview proxies follow that value automatically.                                                                        |
| `Order store ... is corrupted`                 | `server/data/orders.json` is invalid JSON. Fix or move it aside. (The API refuses to overwrite it.)                                                                  |
| White page / "Something went wrong"            | A React render error. Open the browser console: `[ErrorBoundary] Render error` shows the component stack. Use _Clear saved bag & reload_ if saved data is suspected. |
| Online payment option disabled                 | Razorpay keys are not set in `.env`.                                                                                                                                 |
| Odd cart after code changes                    | Saved cart is validated on load; bump `CART_STORAGE_KEY` in `src/context/storageKeys.js` if the saved shape changes.                                                 |

Every API request is logged as `[requestId] METHOD /path -> status (ms)`.

## Where to change things

- **Add products / a women's line:** `src/data/catalog.js`, see `docs/ADDING_PRODUCTS.md`.
- **Shipping price, free-shipping limit, max quantity:** `src/config/storeRules.js`.
- **Payment architecture and go-live checklist:** `docs/PAYMENTS.md`.

## Before going live

Not included: database, authentication/admin, inventory locking, payment webhooks, refunds,
SMS/WhatsApp, delivery webhooks and rate limiting. Do not store real customer data in the local
JSON file. Chromium desktop/mobile layout checks are documented in docs/VERIFICATION.md. Other browser engines and live payments have not been verified.

## Source integrity and compilation

Run `npm run verify:source` to detect relative imports pointing to missing source files,
without installing dependencies. Run `npm ci && npm run check` to lint, test, and compile the site.
**These are different checks:** passing import integrity does not prove Vite compilation.

If Vite reports a missing `src/components/ErrorBoundary` file, confirm that
`src/components/ErrorBoundary.jsx` exists in the extracted folder. This archive
contains that file. Extract into a **new empty directory** rather than merging it
with older versions, and run `npm ci` from the directory containing `package.json`.

## Enhanced storefront

See [short handover](docs/CLIENT_HANDOVER.md), [image assets and prompts](docs/ASSETS.md) and [verification](docs/VERIFICATION.md). Routes: /, /shop, /wishlist, /checkout and /help. Collection and search URLs support browser history. Product images are served locally from public/images.



## Local API connection

Vite development and preview serve the real order handlers at /api on the website origin. A separate port 3001 server is not needed for local browsing/checkout. npm run dev:api remains available for standalone backend deployment. A hosted static dist folder still needs a deployed backend and /api routing.

## Order emails

Customer confirmation and owner notifications are integrated with Resend. They stay disabled until server email settings are configured. See [email setup](docs/EMAIL_SETUP.md). Email failure does not cancel a saved order; retries use the existing order reference.
