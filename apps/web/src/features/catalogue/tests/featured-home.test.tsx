import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { FeaturedHome } from "../featured-home";

const products = [15, 9, 1, 5, 2].map((id) => ({
  id,
  title: `Product ${id}`,
  category: { slug: "category", name: "Category" },
  price: { amount: 109.95, currency: "INR" },
  imageUrl: `/api/products/${id}/image`,
}));

function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter><FeaturedHome /></MemoryRouter></QueryClientProvider>);
  return client;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("shows a loading state then renders the five products in the order received", async () => {
  const fetch = vi.fn(async () => Response.json(products));
  vi.stubGlobal("fetch", fetch);
  renderHome();

  expect(screen.getByRole("status").textContent).toBe("Loading featured products…");
  const list = await screen.findByRole("list");
  expect(within(list).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent))
    .toEqual(products.map((product) => product.title));
  expect(within(list).getAllByText("₹109.95")).toHaveLength(5);
  expect(within(list).getAllByRole("link").map((link) => link.getAttribute("href")))
    .toEqual(products.map(({ id }) => `/products/${id}`));
  expect(fetch).toHaveBeenCalledWith("/api/products/featured", expect.anything());
});

it("keeps malformed data out of the cache and lets the shopper retry", async () => {
  const malformed = [{ ...products[0], imageUrl: "https://example.test/product.png" }, ...products.slice(1)];
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(Response.json(malformed, { headers: { "X-Request-Id": "featured-error" } }))
    .mockResolvedValueOnce(Response.json(products)));
  const client = renderHome();

  expect((await screen.findByRole("alert")).textContent).toBe("The API returned an invalid response.");
  expect(screen.getByText("Request ID: featured-error")).toBeTruthy();
  expect(client.getQueryData(["catalogue", "featured"])).toBeUndefined();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(within(await screen.findByRole("list")).getAllByRole("listitem")).toHaveLength(5);
});
