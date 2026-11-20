# Verification — 20 November 2026

## Automated checks

`npm run check` passed: source/import integrity, ESLint, 92 tests across eight files, and Vite production build.

Coverage includes cart calculations/storage, quantity limits, server validation/API handling, COD orders, Razorpay callbacks/verification errors, shareable URLs, browser popstate, wishlist removal and keyboard dialog focus.

Razorpay UI tests use mocks. No live payment was charged.

## Chromium browser review

- Desktop: 1440 × 1000; mobile: 390 × 844 and 320 × 740.
- Home and collection pages fit the viewport with no horizontal overflow.
- Local product/campaign images loaded successfully.
- Opened a product, confirmed size is required, selected M, added to bag.
- Bag subtotal and delivery progress matched the existing pricing rules.
- Opened checkout, a direct filtered collection URL and the saved-items route.
- Mobile filters and menu opened; modal focus started on the close control.
- Captured homepage, collection, product, bag, checkout and menu previews.

Preview files are in `docs/previews/`. Full desktop homepage: `home-full.png`.

## Limits

This review used Chromium only, not Safari/iOS or Firefox. API integration tests use temporary stores; the demo is not a production database. Live merchant payments, stock reservation, fulfilment and transactional notifications are outside this redesign. See CLIENT_HANDOVER.md before real sales.

## Expanded catalogue review

Home, full collection (18 products) and Jeans (2 products) checked at 1440px, 390px and 320px: no horizontal overflow or broken images. Added UI test for waist-size filtering and bag persistence, plus server test for numeric waist variants and authoritative pricing. New screenshots use the expanded- prefix.


## Final responsive polish

Collection navigation and scrolled product dialogs checked in Chromium at 320, 390, 768, 820, 1024 and 1440px. No horizontal page overflow; dialog close control stayed visible and clickable after scrolling. Tablet navigation uses the compact menu, mobile touch targets are larger, and safe-area padding is supported for the bag footer. Collection/search page titles now describe the active route. Final check: 92 tests, lint and production build passed. Safari/iOS device testing is still outstanding.

## Checkout API connectivity fix

npm run dev verified to launch API first and then Vite; proxied /api/health and /api/config returned valid JSON through port 5174. Production preview verified through port 4173 with API_PORT=3018. Standard dev/all and preview use the same configured API port. Existing 92 tests, lint and production build passed. No fake local order fallback or automatic order resubmission was added. Static hosting still requires a deployed backend and API routing.

## Final fix for the existing frontend-only server

Confirmed the user's existing Vite process on port 5173 belonged to this project and returned HTTP 500 for /api/config while port 3001 was not listening. Replaced the local external proxy dependency with scripts/store-api.mjs: the same real API handlers now run as Vite middleware in development and preview. No simulated order fallback. The existing 5173 server reloaded configuration and /api/health plus /api/config returned valid JSON with no process listening on 3001. Preview /api/config on 4173 also passed. New isolated Vite integration test placed a real COD order (201, server-calculated total) using temporary storage. Final checks: 94 tests, lint and build passed. Earlier two-process/custom-port instructions above are superseded by this single-process local setup. Static hosting still needs a deployed backend.

## Constants refactor verification

Shared UI copy, navigation and frozen enum-style objects extracted under src/constants. Cart/order validation reuse the catalogue product lookup; available sizes are computed once; filtering no longer copies an already-new array before sorting. Existing URLs, catalogue IDs, local-storage values and API payload values retained. Source integrity, lint and 99 tests passed, including local Vite API order submission and email retry behavior. Live email delivery still requires verified sender/owner settings and a server-side key; no real email was sent by these tests.
