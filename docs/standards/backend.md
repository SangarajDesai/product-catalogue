# Backend standards

The backend is an Express 5 and TypeScript modular monolith. Catalogue and Enquiry run in one deployable. Apply Clean Architecture within each module so the application can swap a catalogue data source, mail sender, or other external dependency at startup. [Decision record](../../decisions.md)

## Module layout and dependencies

Put capability code under `apps/api/src/modules/<module>/`. Add the folders needed by the current slice.

| Layer | Responsibility |
| --- | --- |
| `domain/` | Domain types and rules independent of frameworks and providers. |
| `application/` | Use cases and the interfaces they need from providers. Keep module-owned business errors under `application/errors/`. |
| `http/` | Express routes, request validation, response mapping, and the module's public HTTP error mappings. |
| `infrastructure/` | Implementations of application-owned interfaces, such as a product repository or SMTP sender. Validate and normalize provider data here. |

- Keep Express, provider SDKs, and environment configuration outside domain and application code. Pass dependencies in so use cases can run with test substitutes. Replacing a provider that satisfies the same interface should require changes only to the adapter and its wiring.
- Keep the Express app factory separate from the server entry point. Select providers and connect modules at startup through narrow application interfaces. For example, Enquiry needs a product lookup that supplies an ID and title. Modules access one another through the startup wiring.
- Keep cross-cutting HTTP and logging code under `apps/api/src/shared/`. Run `npm run check:boundaries` to check dependency direction.

## HTTP, errors, and logs

- Validate route parameters, query strings, and request bodies at the HTTP boundary. Call the relevant use case and map its result to the public response described in the slice spec. Define Zod schemas in dedicated `*.schema.ts` files alongside their owning boundary, such as provider and configuration schemas under `infrastructure/schemas/`.
- Use Express 5 promise-returning handlers with the shared final error middleware. Catch an error locally when an adapter translates a provider failure or the application can recover.
- Use `ApplicationError` for transport-independent failures and `HttpError` at the HTTP boundary. Give each module's business errors stable codes and register safe response mappings at startup. Keep translation in the HTTP error mapper and response serialization in middleware. Unmapped errors receive a generic `500`.
- Preserve the JSON error contract `{ error: { code, message, requestId } }` and the `X-Request-Id` header. Log method, route template, status, duration, and request ID with Pino. Keep contact details, request bodies, credentials, and raw provider responses out of logs and public errors.
- Route catalogue data and images through the API. Keep production provider configuration in environment variables with documented local defaults in `.env.example`. Report readiness once the application can serve its configured data.

## Verification

- Test use cases with substitutes for external interfaces. Use Supertest against the Express app factory to verify public responses and failure paths. Use local fixtures to exercise upstream failures without relying on the live provider.
- Run `npm test`, `npm run typecheck`, `npm run check:boundaries`, and the relevant startup and browser checks from the slice spec. [Project setup](../specs/00-project-setup.md)
