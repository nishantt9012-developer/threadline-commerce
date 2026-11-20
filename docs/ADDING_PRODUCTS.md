# Adding new collections

The brand is **Threadline**, not tied to one audience. Components use neutral names such as `ProductCard` and `Shop`.

- `src/data/catalog.js` defines `audiences`, `categories` and `products`.
- Launch audience: `men`. Future audiences: `women`, `unisex` (shown as Coming Soon, disabled until products are ready).
- Product has independent `audience`, `categoryId`, `category`, `sizes`, `price` and `tags`. Existing shopping/cart/checkout logic is shared.
- To launch women: add entries with `audience: 'women'`, add categories as needed, and remove `comingSoon` on women tab. Validate sizing, pictures and inventory before launch.
- Keep existing numeric IDs stable because carts and orders reference them. In a real database use immutable product and variant IDs.
- Server uses the **same** source catalogue to validate orders and compute trusted totals.
- Current images are third-party demo images, not licensed retail product photography. Replace them with your own product assets.
