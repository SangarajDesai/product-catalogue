# Product catalogue

The project setup slice runs a React app and an Express API behind one browser origin. The home page shows whether the API is ready.

## Run with Docker

With Docker and Compose installed, run this command from the repository root.

```sh
docker compose up --build --wait
```

Open [the app](http://localhost:8080) and look for **API is ready**. The [readiness endpoint](http://localhost:8080/api/health) returns `{"status":"ok"}`. Use `docker compose logs api` for API diagnostics and `docker compose down` to stop the stack.

## Run natively

Use Node.js 22.12 or later in the Node 22 line, with npm. Run `npm ci`, then start the two processes in separate terminals.

```sh
./scripts/dev.sh api
./scripts/dev.sh web
```

Open [the app](http://localhost:5173). Vite proxies `/api` to `127.0.0.1:3000`. The defaults work without configuration. To override them, copy `.env.example` to `.env` at the repository root. If port `3000` is occupied, set `API_PORT` to a free port in `.env` so both native processes use the same setting. `API_HOST` controls the API listener, which must be reachable over IPv4 loopback for Vite to proxy requests. `WEB_PORT` controls the Vite port and `LOG_LEVEL` applies to either startup path.

## Verify

```sh
npm test
npm run typecheck
npm run check:boundaries
npm run build
```

For the browser smoke test, start the Compose stack first.

```sh
npm exec -- playwright install chromium
npm run test:e2e
```

Set `PLAYWRIGHT_BASE_URL=http://localhost:5173` to run the same smoke test against the native processes.

## Decisions and assumptions

React and Express use TypeScript and separate builds, so a reviewer can use a browser and the frontend and API can evolve independently. The backend is a modular monolith with replaceable product and mail providers as those capabilities land. The [decision record](decisions.md) captures the trade-offs and links to the [setup spec](docs/specs/00-project-setup.md) and remaining slices.
