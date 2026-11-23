# Product catalogue MVP decisions

The planned MVP covers all five acceptance criteria in the AI-Native Engineer challenge. The decisions below record the agreed behaviour, the assumptions behind it, and the trade-offs made for the two-to-three-hour time box.

## Shopper experience

| Decision | Agreed behaviour | Rationale |
| --- | --- | --- |
| Featured home products | Show exactly five products selected by the catalogue owner, in the configured order. The owner selects product IDs through configuration. | The brief says the owner has chosen the products. Configuration supports curation within the time box. |
| Category browsing | A category link opens a page with one owner-selected featured product followed by the other products in that category. Each product appears once on the page. | An independent choice gives every demo category a featured product, even when none of the home picks belong to that category. In this MVP, the brief's “top rated” products are owner-selected features. |
| Search | Search across the full catalogue on submission. Trim the query and match it as a case-insensitive substring of the title or description. Disable submission for empty or whitespace-only input. Show a clear message when a nonblank query has zero matches. | The rule is straightforward to explain and verify with a small catalogue. |
| Product details and price | A product tile opens a page showing the title, image, category, description, price, and an **Enquire** button. Display prices in INR. Treat Fake Store's numeric values as INR amounts because the API supplies no currency code. For example, `109.95` displays as `₹109.95`. | Fake Store supplies the product fields needed for the page. INR is an explicit demo assumption, and future markets can show other currencies. |
| Product enquiry | **Enquire** opens a form for the selected product. Name and email are required, and a message is optional. The sales inbox receives the product, contact details, and any message. Show **Thank you** after sending succeeds. If sending fails, show an error, keep the entered details, and let the shopper retry. | Sales has a reply address and product context, and shoppers get feedback that reflects the send outcome. |

Use the [documented demo picks](README.md#catalogue-and-featured-selections) until the owner supplies product IDs.

## Architecture, technologies, and tools

| Decision | Choice and rationale |
| --- | --- |
| Repository and delivery | Use one npm workspace repository with separately buildable `apps/api` and `apps/web` applications. Docker Compose runs a web container, an API container, and Mailpit. Nginx serves the web build and proxies `/api` to Express so the browser uses one origin. A native shell script starts individual components without Docker. The reviewer target is a local start in under ten minutes. |
| Backend architecture | Use Express 5 on Node.js with TypeScript. Deploy Catalogue and Enquiry together as a modular monolith. Each capability owns its HTTP, application, domain, and infrastructure code. Business-owned interfaces and startup wiring make providers replaceable. Automated import checks enforce layer and module boundaries. |
| Catalogue source and images | Route catalogue data and photos through the backend. At startup, try Fake Store with a short timeout and select a validated in-memory dataset for the life of the process. Use a bundled metadata snapshot when live data is unavailable or cannot satisfy the featured selections. Fetch photos through the API and serve a local placeholder when unavailable. |
| Enquiry and mail | Enquiry uses a narrow server-side product lookup and an email sender interface. Send through configurable SMTP and use Mailpit for review. The inbox is the only enquiry record. It gives the reviewer observable receipt without an external account and avoids storing a separate copy of contact details. |
| Backend errors and logging | Use Express 5 promise rejection forwarding and one final error middleware. Define transport-independent `ApplicationError`, HTTP-specific `HttpError`, and HTTP error mapping in separate files. Each module owns its business error files under its own `application/errors/` directory and supplies safe HTTP responses at startup. Use Pino for structured, request-correlated diagnostics and omit contact details, credentials, and raw payloads. |
| Frontend architecture | Use React and TypeScript with React Router and TanStack Query. Organize by Catalogue and Enquiry capabilities so catalogue pages can reuse their own product components. Put cross-feature UI primitives in a shared components folder. Give each feature a recoverable error boundary so an Enquiry render failure leaves product details available. |
| HTTP contracts | Keep server schemas and frontend response types independent. Validate JSON in the frontend API layer with feature-owned Zod schemas and derive types from those schemas. Share transport helpers within the frontend. A real browser journey checks that the separately owned contracts work together. |
| Testing tools | Use Vitest in both workspaces, Supertest for Express integration tests, and jsdom and React Testing Library for UI tests. Keep UI tests in a `tests/` directory within the feature, app shell, or shared component area they exercise. Extend one Playwright journey across slices, ending with receipt in Mailpit. Keep the fast suites independent of Docker and external providers. |
| Future extraction | Revisit microservices when a capability has an observed need for independent scaling, deployment, or failure isolation. Revisit micro frontends when separate teams need independent release cycles. Use in-process calls and one frontend build for the MVP. |

### Implementation specs

1. [Project setup](docs/specs/00-project-setup.md)
2. [Featured home](docs/specs/01-featured-home.md)
3. [Catalogue browsing](docs/specs/02-catalogue-browsing.md)
4. [Product enquiry](docs/specs/03-product-enquiry.md)

Each spec describes a runnable state of the repo, with automated checks, browser acceptance, and an engineer review checkpoint before the next slice.

## Scope and evolution

- Keep owner curation in configuration for the MVP. An admin editing interface and customer ratings are deferred. This keeps the focus on the shopper's browse-to-enquiry flow.
- Use title and description substring matching for search. Fuzzy matching can be evaluated when choosing a longer-term product data store.
- Use INR for the demo and email for enquiries. Geography-based currency selection and other contact channels are future enhancements.
- Keep the product source and mail provider behind replaceable interfaces. Shared UI primitives let the app adopt the eventual visual design as it becomes available.

## With another day

Exercise a second product source or mail adapter to verify the replacement boundaries. Then evaluate fuzzy search against the longer-term catalogue source and define how currency should be selected for each market.
