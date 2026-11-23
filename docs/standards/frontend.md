# Frontend standards

The frontend is one React and TypeScript app. Use React Router for navigation and TanStack Query for server state. Organize UI code by capability so each feature owns its components, API response schemas, and tests. [Decision record](../../decisions.md)

## Feature layout

- Put capability code under `apps/web/src/features/<feature>/`. Catalogue owns featured home, category browsing, search, and product details. Enquiry owns the form and submission states.
- Keep the router, app shell, and provider setup under `apps/web/src/app/`. Compose features at the UI entry points that display them together.
- Put reusable UI primitives and the reusable error boundary in `apps/web/src/shared/components/`. Keep components that express feature behaviour in that feature. Share HTTP transport and common error parsing through `apps/web/src/shared/http/`.
- Put feature tests in the owning feature's `tests/` folder. Keep app shell and shared component tests in their own `tests/` folders. Keep the cross-app Playwright suite at the repository root under `tests/e2e/`.

## API and state

- Use the same-origin `/api` endpoints for catalogue data and image URLs. The backend owns calls to Fake Store and SMTP.
- Keep response schemas in the owning feature. Validate JSON with Zod before returning it from the API client to TanStack Query. Derive UI types from the schemas and keep them independent of the server's internal types.
- Use TanStack Query for API reads and mutations. Key reads by the inputs that determine the result. Keep form values local to the feature. Render the loading, empty, error, or success states relevant to the feature.
- For an enquiry submission, disable automatic mutation retries and prevent repeated submits while pending. Preserve the entered values after a failed request and let the shopper retry manually.

## Error isolation

- Mount a separate React error boundary at each feature entry point. An unexpected rendering failure inside a feature shows a recovery action in that feature while the app shell and surrounding features remain usable.
- Mount the Enquiry boundary inside the product page so an Enquiry component failure leaves the product details visible.
- Handle expected network, HTTP, and Zod response errors in the feature's query or form states. Show the request ID when available for troubleshooting.

## Verification

- Use Vitest with jsdom and React Testing Library. Exercise the rendered UI with stubbed HTTP responses and a fresh TanStack Query client for each test. Cover the feature's success and failure paths and verify isolation when changing an error boundary.
- Run `npm test`, `npm run typecheck`, and `npm run check:boundaries`. Verify the feature in a browser and extend the existing Playwright journey as specified for the slice. [Project setup](../specs/00-project-setup.md)
