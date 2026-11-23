---
name: product-catalogue-qa
description: Validate shopper-facing product catalogue behavior against the challenge PDF and agreed functional decisions. Use for functional QA of the app or a named slice.
---

# Product catalogue functional QA

Read the shopper acceptance criteria on pages 2–3 of `docs/Code Challenge - AI-Native Engineer-1.pdf`, the shopper decisions in `decisions.md`, and the relevant slice spec. Cover all five flows unless the user names a slice.

Start the app using the README. Prefer the bundled catalogue for predictable results. Run the existing Playwright journey, then check any missing cases in the browser or with focused functional tests. Use synthetic contact details and local Mailpit.

- **Home** — Exactly five distinct owner-selected products appear in the configured order.
- **Category** — A category link shows its configured featured product first, then the remaining products in that category without duplicates.
- **Search** — Clicking Search trims the query and matches title or description regardless of case. Verify a description-only match, blank input, and the no-results state.
- **Product details** — A product tile opens the correct title, image, category, full description, INR price, and **Enquire** action.
- **Enquiry** — The selected product stays visible. Name and valid email are required, and the message is optional. Match the delivered email in Mailpit to the product and test contact. Verify **Thank you** after success and that a failed send preserves the fields for manual retry.

Report **Pass**, **Fail**, or **Blocked** for each flow in scope, with a short note about what you observed. For failures, include reproduction steps and expected versus actual behavior. If the PDF is unavailable, continue with the agreed decisions and flag that direct comparison was blocked.
