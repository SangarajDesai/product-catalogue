# Product catalogue

The catalogue shows five featured products, lets shoppers browse by category or search by title and description, and opens a details page from any product tile. Shoppers can send an enquiry from that page. A React app and an Express API run behind one browser origin.

## Run with Docker

With Docker and Compose installed, run this command from the repository root.

```sh
docker compose up --build --wait
```

Open [the app](http://localhost:8080) to browse the featured products. To try an enquiry, open a product, select **Enquire**, and submit the form. Open [the Mailpit inbox](http://localhost:8025) to view the resulting email.

The [readiness endpoint](http://localhost:8080/api/health) returns `{"status":"ok"}` once the catalogue has loaded. Use `docker compose logs api` to see which catalogue source loaded and `docker compose down` to stop the stack.

## Run natively

Use Node.js 22.12 or later in the Node 22 line, with npm, and install [Mailpit](https://mailpit.axllent.org/docs/install/). Run `npm ci`, then start these processes in separate terminals.

```sh
./scripts/dev.sh mail
./scripts/dev.sh api
./scripts/dev.sh web
```

Open [the app](http://localhost:5173). Vite proxies `/api` to `127.0.0.1:3000`. The defaults work without configuration. To override them, copy `.env.example` to `.env` at the repository root. If port `3000` is occupied, set `API_PORT` to a free port in `.env` so both native processes use the same setting. `API_HOST` controls the API listener, which must be reachable over IPv4 loopback for Vite to proxy requests. `WEB_PORT` controls the Vite port and `LOG_LEVEL` applies to either startup path.

Native SMTP uses `localhost:1025` by default. Set `SMTP_HOST` and `SMTP_PORT` to use a different SMTP endpoint natively. Compose connects to `mailpit:1025` on its internal network. Both paths expose [the Mailpit inbox](http://localhost:8025) and accept `SMTP_FROM` and `SMTP_TO` to change the default sender (`catalogue@example.test`) and sales recipient (`sales@example.test`).

## Catalogue and featured selections

The API tries Fake Store once at startup with a three-second timeout. It keeps the selected dataset in memory until restart and uses the bundled metadata snapshot if the live data is unusable. Set `CATALOGUE_SOURCE=snapshot` to select the snapshot directly. Product photos are fetched through the API, with a local placeholder when a photo is unavailable. [Fake Store API](https://fakestoreapi.com/products)

The default home IDs are `1, 2, 5, 9, 15` in that order. They correspond to the Fjallraven backpack, the men's slim-fit T-shirt, the John Hardy bracelet, the WD 2 TB drive, and the BIYLACLESEN snowboard jacket. Set `CATALOGUE_FEATURED_HOME` to five distinct comma-separated IDs to change the selection or order.

The default category picks are `mens-clothing` → `1`, `jewelery` → `5`, `electronics` → `9`, and `womens-clothing` → `15`. Set `CATALOGUE_FEATURED_CATEGORIES` to a JSON object mapping each category slug to a product ID in that category. Restart the API after changing catalogue settings. A configuration that fits neither dataset prevents the API from starting.

## Verify

```sh
npm test
npm run typecheck
npm run check:boundaries
npm run build
```

For the browser smoke test, start Compose with the bundled catalogue, default featured picks, and default SMTP addresses. The test submits an enquiry and checks that it arrives in Mailpit.

```sh
npm exec -- playwright install chromium
CATALOGUE_SOURCE=snapshot docker compose up --build --wait
npm run test:e2e
```

Set `PLAYWRIGHT_BASE_URL=http://localhost:5173` to run the same smoke test against the native processes, with Mailpit running. Start the native API with `CATALOGUE_SOURCE=snapshot` for that run.

## Decisions and assumptions

React and Express use TypeScript and separate builds, so a reviewer can use a browser and the frontend and API can evolve independently. The backend is a modular monolith with replaceable product and mail providers. The [decision record](decisions.md) captures the trade-offs and links to the [setup spec](docs/specs/00-project-setup.md) and vertical slices.
