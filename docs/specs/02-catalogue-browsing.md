# 02 Catalogue browsing

Let shoppers navigate categories, submit a search, and open a product details page. Use the same selected catalogue across home, categories, search, and details.

**Prerequisite:** [Featured home](01-featured-home.md) has passed review.

## Contract and behaviour

| API | Response |
| --- | --- |
| `GET /api/categories` | Returns an array of `{ slug, name }` objects for category navigation. |
| `GET /api/categories/:slug` | Returns `{ category, featured, products }`. `featured` is the configured product summary. `products` contains the remaining product summaries in that category. An unknown slug returns `404`. |
| `GET /api/products?q=…` | Returns a JSON array of matching product summaries. Trim `q`, then match a case-insensitive substring in the title or description across the catalogue. A valid query with zero matches returns `[]`. A missing or blank query returns `400`. |
| `GET /api/products/:id` | Returns a product summary with its full `description`. An unknown product returns `404`. |

- A category link opens `/categories/:slug`. Render one featured product first, then the remaining category products. Render each product once.
- The search form accepts clicks or Enter on a nonblank term. On submit, navigate to `/search?q=…` with the trimmed term. Use that term to drive the TanStack Query request. Show a clear no-results message and distinguish it from a request failure.
- A tile from home, a category, or search opens `/products/:id`. Show the title, image, category, full description, and an INR price. Use the amount as supplied by Fake Store and use the currency from the API for formatting.
- Keep product components and response schemas inside Catalogue. Parse responses with Zod before caching them. Handle loading, HTTP errors, and malformed responses within the feature. Show the request ID on failures when available. Use its error boundary for unexpected render failures and offer recovery from the fallback.

## Run and verify

From the repository root:

```sh
npm test
npm run typecheck
npm run check:boundaries
CATALOGUE_SOURCE=snapshot docker compose up --build --wait
npm run test:e2e
```

- **Backend:** Assert category membership and featured exclusion from the remaining product list. Use a fixture with a title match, a description-only match, and a nonmatch. Verify trimming, case-insensitive matching, and empty results. Check response shapes and missing-resource behaviour through Supertest.
- **UI:** Verify the Search button is disabled for whitespace, that submission uses the trimmed term, and that a zero-result response shows the correct state. Check recovery from a malformed product response and from a controlled Catalogue render failure. Verify that the product view formats INR correctly.
- **Browser:** From `http://localhost:8080`, open a category and verify the featured product appears once. Submit a known snapshot search term, open a matching product, and verify the details and INR price. Open a product URL directly to confirm the web container serves deep links. Extend the existing Playwright journey through these screens.

Record the actual results and stop for engineer review before [product enquiry](03-product-enquiry.md).
