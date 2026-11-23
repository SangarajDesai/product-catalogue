# AI Usage

## Model
- **Model:** Sol 6.2
- **Reasoning effort:** Medium / High
- **Tool:** Codex

## Agent Instructions
- `AGENTS.md`

## Skills
- `grill-with-docs`
- `grilling`
- `commit-message`
- `pr-description`

## Planning and implementation

**Plan Mode.** I used `grill-with-docs` to challenge the proposed architecture and agree on the module boundaries, provider interfaces, and testing strategy before implementation. We turned the plan into a project setup spec and three vertical slice specs, each with run commands and acceptance checks. [Decision record](decisions.md) · [Project setup spec](docs/specs/00-project-setup.md)

**Agent Mode.** I asked Codex to implement one approved slice at a time using `AGENTS.md` and the backend and frontend standards. Codex ran the relevant automated checks and browser tests and reported the results for review. I used my code review feedback to direct the corrections described below. [Backend standards](docs/standards/backend.md) · [Frontend standards](docs/standards/frontend.md)

## Time spent

| Activity | Time |
| --- | --- |
| Planning | 1 hour |
| Implementation | 1 hour 30 minutes |
| Testing | 30 minutes |
| **Total** | **3 hours** |

## Prompts and code review

1. **Architecture direction.** I proposed a “modular monolith for backend and feature based for UI application” and asked Codex to challenge the design. Inside each backend module, I asked for Clean Architecture so “we can plug in and plug out” external dependencies. The application layer owns the interfaces that its use cases need. Infrastructure adapters implement those interfaces, and the app wires them at startup. That lets us swap a catalogue data store, email sender, or other external provider that meets the same interface without changing the business logic. Tests can wire in substitutes the same way. We agreed to revisit service or frontend extraction when there is evidence that parts of the system need to ship or scale independently.
2. **Technology and quality choices.** I chose the framework and data-fetching library with “Lets use express” and “and react query for ui”. I also asked for structured logging, centralized async error handling, a shared component folder, Zod response validation, and separate UI and backend tests alongside Playwright. I asked for a React error boundary around each feature so an unexpected render error in one of its components shows a recovery state inside that feature. The app shell and surrounding features stay usable. For example, the Enquiry boundary will sit inside the product page so an Enquiry form error leaves the product details visible. The setup test verifies that a feature can recover while its sibling stays visible.
3. **Setup code review.** The first implementation kept business-to-HTTP error mapping in the shared middleware and put UI tests in a top-level web test directory. I asked Codex to separate error handling so “we can cover business errors also” and confirmed that each UI feature should have its own tests folder. Codex moved HTTP mapping into its own file, gave backend modules a way to register their own business error responses, moved the existing UI tests beside the code they cover, and removed the empty test folder. Codex verified mapped and unmapped errors and reran all ten API and UI tests, the type and import-boundary checks, both builds, and the Compose Playwright smoke test. [Setup verification record](docs/specs/00-project-setup.md#verification-record)
4. **Featured-home code review.** Codex initially defined Zod schemas inline in the backend adapters and frontend API code. I asked it to “move them to respective schema files” on both sides. Codex extracted the catalogue configuration, Fake Store product, frontend product, and shared error schemas into dedicated `*.schema.ts` files. It interpreted my file-naming feedback as a request for a catalogue-specific name and renamed the helper to `read-catalogue-response-body.ts`, keeping it in infrastructure because it reads HTTP streams. Codex documented the schema convention and verified the refactor with all 34 API and UI tests, type and import-boundary checks, both builds, and the Compose Playwright smoke test. [Backend standards](docs/standards/backend.md) · [Frontend standards](docs/standards/frontend.md)
