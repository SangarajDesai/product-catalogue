import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { CatalogueLayout } from "../catalogue-layout";
import { CategoryPage } from "../category-page";
import { ProductPage } from "../product-page";
import { SearchPage } from "../search-page";

const category = { slug: "bags", name: "Bags" };
const product = {
  id: 1,
  title: "Trail backpack",
  category,
  price: { amount: 109.95, currency: "INR" },
  imageUrl: "/api/products/1/image",
  description: "A backpack with a padded laptop sleeve.",
};

function renderCatalogue(path: string) {
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<CatalogueLayout />}>
            <Route path="/categories/:slug" element={<CategoryPage />} />
            <Route path="/products/:id" element={<ProductPage />} />
            <Route path="/search" element={<SearchPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("disables whitespace submissions and sends a trimmed term only after search is submitted", async () => {
  const fetch = vi.fn(async (url: string) => Response.json(url === "/api/categories" ? [category] : []));
  vi.stubGlobal("fetch", fetch);
  renderCatalogue("/search?q=%20");

  const field = screen.getByRole("searchbox", { name: "Search products" });
  const button = screen.getByRole<HTMLButtonElement>("button", { name: "Search" });
  expect(screen.getByText("Enter a search term to find products.")).toBeTruthy();
  fireEvent.change(field, { target: { value: "   " } });
  expect(button.disabled).toBe(true);
  fireEvent.submit(screen.getByRole("search"));
  expect(fetch.mock.calls.every(([url]) => url === "/api/categories")).toBe(true);

  fireEvent.change(field, { target: { value: "  hiking bag  " } });
  expect(button.disabled).toBe(false);
  expect(fetch.mock.calls.every(([url]) => url === "/api/categories")).toBe(true);
  fireEvent.click(button);

  expect(await screen.findByText("No products found for “hiking bag”.")).toBeTruthy();
  expect(fetch).toHaveBeenCalledWith("/api/products?q=hiking+bag", expect.anything());
});

it("keeps the featured category tile separate and links catalogue tiles to details", async () => {
  const { description: _description, ...summary } = product;
  const second = { ...summary, id: 2, title: "Day pack", imageUrl: "/api/products/2/image" };
  vi.stubGlobal("fetch", vi.fn(async (url: string) => Response.json(
    url === "/api/categories" ? [category] : { category, featured: summary, products: [second] },
  )));
  renderCatalogue("/categories/bags");

  const featured = await screen.findByRole("region", { name: "Featured in this category" });
  const remaining = screen.getByRole("region", { name: "More in this category" });
  expect(within(featured).getByRole("link", { name: /Trail backpack/ }).getAttribute("href")).toBe("/products/1");
  expect(within(remaining).getByRole("link", { name: /Day pack/ }).getAttribute("href")).toBe("/products/2");
  expect(screen.getAllByRole("heading", { name: "Trail backpack" })).toHaveLength(1);
});

it("recovers from malformed product details and shows the full description and INR amount", async () => {
  let productRequests = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (url === "/api/categories") return Response.json([category]);
    if (++productRequests === 1) {
      return Response.json({ ...product, description: null }, { headers: { "X-Request-Id": "detail-error" } });
    }
    return Response.json(product);
  }));
  const client = renderCatalogue("/products/1");

  expect((await screen.findByRole("alert")).textContent).toBe("The API returned an invalid response.");
  expect(screen.getByText("Request ID: detail-error")).toBeTruthy();
  expect(client.getQueryData(["catalogue", "product", "1"])).toBeUndefined();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));

  const details = await screen.findByRole("article", { name: product.title });
  expect(within(details).getByText(product.description)).toBeTruthy();
  expect(within(details).getByText("₹109.95")).toBeTruthy();
  expect(within(details).getByRole("img", { name: product.title }).getAttribute("src")).toBe(product.imageUrl);
  expect(within(details).getByRole("link", { name: "Bags" }).getAttribute("href")).toBe("/categories/bags");
});

it("keeps the app heading visible during a catalogue render failure and offers recovery", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json([category])));
  let shouldFail = true;
  function CataloguePage() {
    if (shouldFail) throw new Error("Catalogue rendering failed in the test");
    return <p>Recovered page</p>;
  }

  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <Routes>
          <Route element={<CatalogueLayout />}>
            <Route index element={<CataloguePage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
    { onCaughtError: () => undefined },
  );

  expect(screen.getByRole("heading", { name: "Product catalogue" })).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toBe("Could not display the catalogue.");
  shouldFail = false;
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Recovered page")).toBeTruthy();
});
