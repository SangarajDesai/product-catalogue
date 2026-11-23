# 03 Product enquiry

Let a shopper enquire about a specific product. The reviewer can see the resulting email in Mailpit and observe the shopper's **Thank you** state.

**Prerequisite:** [Catalogue browsing](02-catalogue-browsing.md) has passed review.

## Contract and delivery

- Add **Enquire** to the product details page and open an Enquiry-owned form. Require name and a valid email address. Accept an optional message. Keep the selected product visible while the form is open.
- `POST /api/products/:id/enquiries` accepts `{ name, email, message? }`. Validate inputs at the HTTP boundary and trim text. Treat a blank optional message as omitted. Resolve the product ID and title server-side through a narrow Catalogue lookup interface. Invalid input returns `400` and an unknown product returns `404`. Neither case sends mail.
- Send through an Enquiry-owned email sender interface with a configurable SMTP adapter. Use the configured sender and sales recipient, set reply-to from the submitted email, and include the product ID, title, name, email, and any message. Use the inbox as the only record of the enquiry.
- Return `204` when SMTP accepts the message for the sales recipient. Return `503` with the standard error envelope if mail delivery is unavailable. Log diagnostics with the request ID using the policy in [project setup](00-project-setup.md).
- Use a TanStack Query mutation with automatic retries disabled. While pending, prevent repeat submissions. Show **Thank you** after the `204` response. On failure, show a recoverable error with the request ID when available, retain the form values, and let the shopper retry manually. Handle `204` as the expected empty success response.
- Mount the Enquiry error boundary inside product details. An unexpected Enquiry rendering failure displays a local recovery state while the product details remain available.

## Local inbox

- Add Mailpit to Compose. The API connects to `mailpit:1025` on the Compose network. Publish the reviewer inbox at `http://localhost:8025`.
- Document SMTP host, port, sender, and recipient in `.env.example` with defaults that work for the local inbox. Add `./scripts/dev.sh mail` to start an installed Mailpit binary for native development. Native SMTP uses `localhost:1025`.

## Run and verify

From the repository root:

```sh
npm test
npm run typecheck
npm run check:boundaries
CATALOGUE_SOURCE=snapshot docker compose up --build --wait
npm run test:e2e
```

- **Backend:** With injected providers, assert that invalid contact details and unknown products send no mail. Verify that a successful request delivers the expected message fields and that an SMTP failure produces `503`. Confirm that contact details and the message are absent from request logs on both paths.
- **UI:** Test validation, pending submission, success, failure with values preserved, and manual retry. Verify that an Enquiry rendering failure leaves product details visible.
- **Browser:** Open `http://localhost:8080`, browse and search, open a product, and submit an enquiry with a unique test address. Verify **Thank you** and the matching product, contact details, and message at `http://localhost:8025`. Extend the single Playwright journey to assert both confirmation and mailbox receipt. Match the email by the unique address so old inbox entries cannot satisfy the check.
- **Reviewer startup:** Stop the test stack with `docker compose down`. Time the README instructions from a fresh checkout with Docker and Compose installed and note whether images were cached. Run `docker compose up --build` with the default configuration and verify the catalogue and inbox are usable within the ten-minute target. Stop Compose, then verify the native workflow by starting `mail`, `api`, and `web` in separate terminals and submitting an enquiry through `http://localhost:5173`.

Record the measured setup time and actual test and browser results for engineer review.

## Verification record

- `npm test` passed with 47 API tests and 13 UI tests. Type checks, dependency boundary checks, and both production builds passed.
- The Playwright journey passed against Compose and against the native services. It confirmed **Thank you** and matched exactly one Mailpit message by the shopper's unique reply-to address, then verified the sender, recipient, subject, and body.
- In Chrome on Compose, a test enquiry arrived with the expected product and contact details. With Mailpit stopped, the form preserved the inputs and showed a request ID that matched a `503 MAIL_UNAVAILABLE` log entry. The API log contained no test contact details or message. After Mailpit restarted, **Try again** produced one matching email and showed **Thank you**.
- Default Compose startup reached a usable catalogue and inbox in 8.21 seconds with cached Docker images and build layers. The run used a fresh source copy of the uncommitted slice without local configuration or dependencies. The API loaded the live catalogue.
- Native verification ran `mail`, `api`, and `web` separately and submitted through port `5173`. The API and Vite proxy used `API_PORT=3001` because port `3000` was already occupied.
