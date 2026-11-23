# 00 Project setup

Establish a runnable React and Express baseline. A browser should load the app shell and reach the Express readiness endpoint through the same origin.

**Prerequisite:** Node.js 22 and npm for development and testing. Docker with Compose is required for the primary reviewer path. Native development uses separate processes.

## Repository and execution

- Use one npm workspace with a root lockfile, `apps/api` for Express 5 and TypeScript, and `apps/web` for React, TypeScript, Vite, React Router, and TanStack Query. Keep separate Dockerfiles and build commands. Put cross-app Playwright tests at `tests/e2e/`.
- Keep root commands for `npm test`, `npm run typecheck`, `npm run check:boundaries`, and `npm run test:e2e`. Use Vitest in both workspaces, Supertest for Express, React Testing Library with jsdom for UI tests, and Playwright with Chromium for browser tests. Fast tests use local fixtures and injected substitutes.
- Serve the React build with Nginx, proxy `/api` to the API container, and serve the React entry point for deep links. Publish the Compose web app at `http://localhost:8080` and keep the API on the Compose network. In native development, Vite serves `http://localhost:5173` and proxies `/api` to the native API on port `3000`.
- Provide `./scripts/dev.sh web` and `./scripts/dev.sh api` as native entry points. Add `./scripts/dev.sh mail` with [the enquiry slice](03-product-enquiry.md). Document startup, prerequisites, and environment defaults in the README and `.env.example`. Include a short README decisions and assumptions section linking to [the decision record](../../decisions.md).

## Boundaries

- Separate the Express app factory from the process entry point. Tests build an app with injected dependencies. The process entry point selects providers, initializes the app, and starts listening.
- Put Catalogue and Enquiry under `apps/api/src/modules/` as they land. Each owns its HTTP routes, application use cases and provider interfaces, domain types, and infrastructure adapters. HTTP and infrastructure depend on application contracts. Domain and application code stay independent of Express, SMTP, and Fake Store. The entry point wires cross-module calls through public interfaces. Automatically check these import rules.
- Put web capability code under `apps/web/src/features/`, with a `tests/` directory inside each feature. Keep app shell and shared component tests with the code they exercise. Share reusable UI primitives and the error boundary component through `src/shared/components/`. Share HTTP transport and error parsing through `src/shared/http/`. Map malformed JSON, invalid response shapes, and unexpected content types to recoverable API errors. Feature components and Zod response schemas belong in their respective features. Mount the boundary separately for each feature as it lands.

## Readiness, errors, and logs

- The app shell renders at `/`. `GET /api/health` returns `200` with `{ "status": "ok" }` when the API is ready. Give the API and web containers health checks so `docker compose up --wait` waits for readiness, including the web proxy. Starting with the featured home slice, initialize the selected catalogue before accepting requests.
- Register promise-returning async handlers and middleware directly with Express 5. Route rejections to one final error middleware. Use local catches for recovery or provider-specific failure translation.
- Keep `ApplicationError`, `HttpError`, and HTTP error mapping in separate files. A module defines its business errors in its own `application/errors/` directory and supplies their public HTTP status and message at startup. The middleware returns `{ "error": { "code": "…", "message": "…", "requestId": "…" } }`. Return `400` for invalid input, `404` for missing resources or API routes, `503` when Enquiry registers mail unavailability, and a generic `500` for unexpected or unmapped errors.
- Generate a request ID before parsing the body and return it as `X-Request-Id`. Use Pino with configurable log level. Record method, route template, status, duration, request ID, and error code when present. Keep contact details, bodies, credentials, and raw provider payloads out of logs and public errors.

## Run and verify

From the repository root after this setup is implemented:

```sh
npm ci
npm exec -- playwright install chromium
npm test
npm run typecheck
npm run check:boundaries
docker compose up --build --wait
curl -fsS http://localhost:8080/api/health
npm run test:e2e
```

- The browser smoke test opens the app shell through Nginx and confirms readiness through the proxied API. Open the same URL manually in a real browser.
- UI tests verify that the app shell renders. API tests verify readiness, the common error shape, and an async rejection reaching the final middleware. Capture a log in a test and confirm the response ID matches the log ID.
- Run `docker compose down` after the Compose check. In two terminals, run `./scripts/dev.sh api` and `./scripts/dev.sh web`. Confirm the app shell and `GET /api/health` through `http://localhost:5173`.

Record the actual build, test, and browser results. Stop for engineer review before [featured home](01-featured-home.md).

## Verification record

Verified on 23 November 2026 with Node.js 22.22.0, npm 10.9.4, and Docker Compose 2.38.2.

- A clean `npm ci` completed and reported zero vulnerabilities. Both production builds, TypeScript checks, and import-boundary checks passed. A fixture with a forbidden cross-module import was rejected. The web build reported two non-blocking warnings from Zod's Rollup annotations.
- All nine fast tests passed, with five API tests and four UI tests.
- Both Compose services reported healthy. The Nginx origin returned `200` and `{"status":"ok"}` for `/api/health`. The Playwright smoke test passed, and the app displayed **API is ready** in Chrome.
- The native API and Vite scripts passed the same Playwright smoke test through `http://localhost:5173`. Chrome displayed **API is ready**. Another process occupied port `3000`, so both native processes ran with `API_PORT=3001`. The default port collision produced a structured `EADDRINUSE` log.
- After the setup review changes, all ten fast tests passed, including registered and unmapped business errors and the relocated UI suites. Type checks, import checks, both builds, and the Compose Playwright smoke test passed. The proxied `404` returned the same request ID in its JSON body and response header.
