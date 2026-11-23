import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { App } from "../app";

function renderApp(initialPath = "/") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("shows the app shell and reads readiness through the same-origin API", async () => {
  const fetch = vi.fn(async () => Response.json({ status: "ok" }));
  vi.stubGlobal("fetch", fetch);
  renderApp();

  expect(screen.getByRole("heading", { name: "Product catalogue" })).toBeTruthy();
  expect(await screen.findByText("API is ready.")).toBeTruthy();
  expect(fetch).toHaveBeenCalledWith("/api/health", expect.anything());
});

it("reports an invalid response and can recover on retry", async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json({ status: "unknown" }, { headers: { "X-Request-Id": "test-id" } }))
    .mockResolvedValueOnce(Response.json({ status: "ok" }));
  vi.stubGlobal("fetch", fetch);
  renderApp();

  expect((await screen.findByRole("alert")).textContent).toBe("The API returned an invalid response.");
  expect(screen.getByText("Request ID: test-id")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("API is ready.")).toBeTruthy();
});

it("shows a route fallback with a way back to the catalogue", () => {
  renderApp("/unknown-page");

  expect(screen.getByRole("heading", { name: "Page not found" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Return to the catalogue" }).getAttribute("href")).toBe("/");
});
