# Threadline — short handover

## Start the website

Open a terminal in `Threadline-Commerce 04` and run:

```powershell
npm install
npm run dev
```

Open the Local URL printed by Vite. It usually uses port 5173; if occupied it chooses the next free port. The local order API runs inside Vite on the same URL. Keep that terminal open. Ctrl+C stops both.

## Client demo in 2 minutes

1. Show the campaign homepage and collection cards.
2. Open Shop All. Filter Shirts/Hoodies, search a product, sort by price.
3. Save a product with the heart. Open Saved for later from the menu/footer.
4. Open a product, select a size, add it to the bag.
5. Change quantity. The free delivery progress and subtotal update.
6. Proceed to checkout. Use dummy details only for this demonstration.
7. Refresh /shop?category=Hoodies to show a shareable collection URL.

Desktop and mobile screenshots are in `docs/previews/`.

## Where to edit

| Change | File |
| --- | --- |
| Product names, prices, sizes, colours | src/data/catalog.js |
| Product and campaign photos | public/images/ |
| Delivery fee, free delivery amount | src/config/storeRules.js |
| Homepage sections | src/pages/Home.jsx |
| Shared styling and responsive breakpoints | src/styles.css |
| Header/footer | src/components/Header.jsx, Footer.jsx |
| Navigation | src/hooks/useNavigation.js |
| Orders and payment verification | server/ |

Components use functions and purpose comments. ErrorBoundary intentionally uses React's class boundary API. Shared cart maths and business rules remain separate from the UI.

## What the enhanced demo includes

Original campaign/product images; responsive collection and product layout; hover and entrance motion; reduced-motion support; persistent bag/wishlist; search/filter/sort; real browser URLs and Back/Forward; keyboard-focus handling in dialogs; existing validated order flow.

## Before real sales

This is a client demonstration with a development API. Orders currently use local JSON storage. Before accepting real customer orders, configure a persistent database, stock management, merchant support details, actual size/care/return policies and notifications. For online payments, set up the merchant's Razorpay account, server-only secrets, webhooks and production verification. See `docs/PAYMENTS.md`.

A static Netlify upload of `dist` serves the UI only; the Node order API needs its own deployment and routing. For any host, configure SPA fallback to index.html for /shop, /wishlist, /checkout and /help while keeping /api routed to the backend.

Use approved real merchandise imagery/details before live selling. The generated assets and exact prompts are documented in `docs/ASSETS.md`.

## Check the code

```powershell
npm run check
```

This runs import checks, lint, tests and a production build. Build output: `dist/`.


## Expanded catalogue

18 products, eight categories: Shirts, Hoodies, Jeans, Cargos, Joggers & Lowers, Trousers, T-Shirts and Jackets. Collection navigation and footer links derive from the shared catalogue. Jeans/cargos/trousers use waist sizes 28–38; new tops and joggers use S–XXL. Available-size and price filters combine with search/category/sort. Waist selections persist in the bag and are validated against the server catalogue.

New previews: docs/previews/expanded-home-1440.png and expanded-collection-390.png.

## Local checkout API

Run npm run dev (or dev:all) and open the Local URL. Vite now serves the real order API itself at /api, so no second terminal or API port is needed. npm run preview also includes this local API after npm run build. Keep the terminal open.

For static hosting, deploy the backend separately and configure /api routing. Online Razorpay payments remain disabled until merchant keys are configured. Orders are never simulated; failed submissions keep the bag.

## Code constants and enums

- src/constants/text.js: shared UI labels, checkout messages and page titles.
- src/constants/index.js: frozen JavaScript enum-style values for routes, filters, sort, payment methods, order/payment status and email status.
- src/constants/navigation.js: shared collection navigation and shop filter lists derived from the catalogue.
- src/data/catalog.js: products plus reused PRODUCT_BY_ID and PRODUCT_SIZES lookups.

Example: import TEXT from its named export and render TEXT.CONTINUE_SHOPPING. Use ROUTE.SHOP instead of repeating the route string. Page-specific campaign copy remains next to its page section; product copy remains in the catalogue. Stored values and API payload values are unchanged.

## GitHub and Netlify

Repository: https://github.com/nishantt9012-developer/threadline-commerce

Import this repository in Netlify. Branch: main. Base directory: leave empty. Build command: npm run build. Publish directory: dist. Project name: threadline-store (or another available name). netlify.toml supplies the build and SPA refresh fallback.

This deploy publishes the frontend demo only. The Vite local API is not included in a static Netlify deployment. Live COD/order storage and customer/owner emails need a separately deployed persistent backend and /api routing, or a serverless-compatible database/API migration. Adding email/payment secrets to Netlify build settings alone does not deploy a backend. Never use VITE_ for private keys.

For later source updates: git add ., git commit -m "Describe your update", git push. Netlify will rebuild after pushes once connected.
