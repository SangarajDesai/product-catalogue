# 01 Featured home

Deliver the first shopper-facing slice. The home page shows exactly five owner-selected products in the configured order.

**Prerequisite:** [Project setup](00-project-setup.md) passes its automated and browser checks.

## Catalogue source and curation

- Introduce the Catalogue module with a business-owned product repository interface. Normalize Fake Store data at the adapter before it enters the application. Keep the selected dataset in memory for the life of the API process.
- On startup, try one live load with a short timeout. Validate the product fields, unique IDs, and featured configuration against the resulting dataset. Fall back to the bundled metadata snapshot on timeout, upstream error, invalid data, or a missing or mismatched selection. Validate the snapshot as well. If neither dataset is usable, fail startup with a clear configuration error. Log the chosen source and a safe reason for fallback.
- Configure five unique, ordered home product IDs and one product ID belonging to each demo category. The demo defaults use the lowest-ID product in each bundled category as its pick. Include those picks and the lowest-ID remaining product in the home list, ordered by ID. Record the selected IDs in the README.
- Default to live-first startup. Support `CATALOGUE_SOURCE=snapshot` for deterministic local checks. Bundle product metadata and a local placeholder asset. Load available photos from Fake Store through the API at runtime.

## Contract and UI

| Interface | Behaviour |
| --- | --- |
| `GET /api/products/featured` | Returns an ordered JSON array of five product summaries. A summary has `id`, `title`, `category` with `slug` and `name`, `price` with `amount` and `currency`, and `imageUrl` pointing to the backend image route. |
| `GET /api/products/:id/image` | Returns the product photo or the local placeholder. For a known product, bound the fetch time and response size, allow only HTTPS on the approved Fake Store image host and path, and reject redirects and unsupported media. An unknown ID returns `404`. |
| `/` | Renders the five featured products. Validate the featured response with a Catalogue-owned Zod schema before placing data in the TanStack Query cache. Show loading and recoverable error states. Mount the Catalogue error boundary at the feature entry point. |

## Run and verify

Use the prerequisites from [project setup](00-project-setup.md). From the repository root:

```sh
npm test
npm run typecheck
npm run check:boundaries
CATALOGUE_SOURCE=snapshot docker compose up --build --wait
npm run test:e2e
```

- **Backend:** Verify featured order, live selection, fallback on source failure or invalid data, fallback on mismatched curation, and a placeholder when fetching a known product photo fails. Use injected providers and fixture data for these cases.
- **UI:** Verify that the configured featured products render in order and that malformed API data produces a recoverable error state. Use a fresh TanStack Query client for each test.
- **Browser:** Open `http://localhost:8080` and check the five product titles against the documented picks in order. Extend the Playwright smoke journey to assert the same result. Use deterministic snapshot data even when the upstream service is available.
- **Live-first smoke:** Run `docker compose down`, then `docker compose up --build --wait` with the default configuration. Check the backend startup log for the selected live or fallback source and confirm the home page still renders.

Record the actual results and stop for engineer review before [catalogue browsing](02-catalogue-browsing.md).
