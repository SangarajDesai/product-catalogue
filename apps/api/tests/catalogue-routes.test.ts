import { readFile } from "node:fs/promises";
import pino from "pino";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { createCatalogue } from "../src/modules/catalogue/application/catalogue.js";
import type { Product } from "../src/modules/catalogue/domain/product.js";
import { catalogueErrorResponses, createCatalogueRoutes } from "../src/modules/catalogue/http/catalogue-routes.js";
import { readCatalogueConfig } from "../src/modules/catalogue/infrastructure/catalogue-config.js";
import { createProductImageProvider } from "../src/modules/catalogue/infrastructure/product-images.js";
import { createSnapshotRepository } from "../src/modules/catalogue/infrastructure/product-sources.js";

const products = await createSnapshotRepository().list();
const { featured } = readCatalogueConfig({ CATALOGUE_FEATURED_HOME: "15,9,1,5,2" });
const placeholder = await readFile(new URL("../assets/catalogue/placeholder.png", import.meta.url));
const tinyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aHQAAAAASUVORK5CYII=", "base64");

async function setup(fetchPhoto: typeof fetch, selectedProducts: readonly Product[] = products) {
  const imageProvider = await createProductImageProvider(fetchPhoto);
  const catalogue = createCatalogue({ list: async () => selectedProducts }, imageProvider, featured);
  return request(createApp({
    logger: pino({ level: "silent" }),
    routes: [createCatalogueRoutes(catalogue)],
    businessErrorResponses: catalogueErrorResponses,
  }));
}

describe("featured catalogue API", () => {
  it("preserves configured order and exposes same-origin image URLs", async () => {
    const fetchPhoto = vi.fn();
    const api = await setup(fetchPhoto);
    const response = await api.get("/api/products/featured").expect(200);

    expect(response.body).toEqual([15, 9, 1, 5, 2].map((id) => {
      const product = products.find((entry) => entry.id === id)!;
      return {
        id,
        title: product.title,
        category: product.category,
        price: product.price,
        imageUrl: `/api/products/${id}/image`,
      };
    }));
    expect(fetchPhoto).not.toHaveBeenCalled();
  });

  it("returns an approved upstream photo with a bounded request", async () => {
    const fetchPhoto = vi.fn(async () => new Response(tinyPng, { headers: { "Content-Type": "image/png" } }));
    const api = await setup(fetchPhoto);
    const response = await api.get("/api/products/1/image").expect(200).expect("Content-Type", "image/png");

    expect(response.body).toEqual(tinyPng);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(fetchPhoto).toHaveBeenCalledWith(new URL(products[0].imageSource), expect.objectContaining({
      redirect: "error",
      signal: expect.any(AbortSignal),
    }));
  });

  it("returns a bundled placeholder when the photo request fails", async () => {
    const api = await setup(async () => { throw new Error("Upstream unavailable"); });
    const response = await api.get("/api/products/1/image").expect(200).expect("Content-Type", "image/png");
    expect(response.body).toEqual(placeholder);
  });

  it("distinguishes an invalid product ID from a missing product", async () => {
    const fetchPhoto = vi.fn();
    const api = await setup(fetchPhoto);
    const invalid = await api.get("/api/products/1e3/image").expect(400);
    const missing = await api.get("/api/products/999/image").expect(404);

    expect(invalid.body.error.code).toBe("INVALID_INPUT");
    expect(missing.body.error).toMatchObject({ code: "PRODUCT_NOT_FOUND", requestId: missing.get("X-Request-Id") });
    expect(fetchPhoto).not.toHaveBeenCalled();
  });
});

describe("catalogue browsing API", () => {
  it("lists each category once and returns only that category's products", async () => {
    const [backpack, shirt, ...rest] = products;
    const api = await setup(vi.fn(), [shirt, backpack, ...rest]);
    const categories = await api.get("/api/categories").expect(200);
    expect(categories.body).toEqual([
      { slug: "mens-clothing", name: "Men's clothing" },
      { slug: "jewelery", name: "Jewellery" },
      { slug: "electronics", name: "Electronics" },
      { slug: "womens-clothing", name: "Women's clothing" },
    ]);

    const { body } = await api.get("/api/categories/mens-clothing").expect(200);
    expect(body.category).toEqual(categories.body[0]);
    expect(body.featured).toMatchObject({ id: 1, category: body.category, imageUrl: "/api/products/1/image" });
    expect(body.products).toMatchObject([2, 3, 4].map((id) => ({ id, category: body.category })));
  });

  it("trims the search and matches title or description across categories, ignoring case", async () => {
    const fixture = [
      { ...products[0], title: "Trail backpack", description: "A padded bag" },
      { ...products[4], title: "Bracelet", description: "Designed for a TRAIL trip" },
      { ...products[8], title: "External drive", description: "Portable storage", category: { slug: "trail", name: "Trail" } },
    ];
    const api = await setup(vi.fn(), fixture);
    const { body } = await api.get("/api/products").query({ q: "  tRaIl  " }).expect(200);
    expect(body).toMatchObject([
      { id: fixture[0].id, title: fixture[0].title },
      { id: fixture[1].id, title: fixture[1].title },
    ]);
    expect(body[1]).not.toHaveProperty("description");
    await api.get("/api/products").query({ q: "no-product-matches-this" }).expect(200, []);
  });

  it.each(["", "?q=", "?q=%20%20", "?q=trail&q=storage"])("rejects missing or invalid search input %s", async (query) => {
    const api = await setup(vi.fn());
    const { body } = await api.get(`/api/products${query}`).expect(400);
    expect(body.error.code).toBe("INVALID_INPUT");
  });

  it("returns the full details and local image URL for a product", async () => {
    const api = await setup(vi.fn());
    const { id, title, category, description, price } = products[0];
    await api.get(`/api/products/${id}`).expect(200, {
      id, title, category, description, price, imageUrl: `/api/products/${id}/image`,
    });
  });

  it.each([
    ["/api/categories/unknown", "CATEGORY_NOT_FOUND"],
    ["/api/products/999", "PRODUCT_NOT_FOUND"],
  ])("returns a request-linked 404 for %s", async (path, code) => {
    const api = await setup(vi.fn());
    const response = await api.get(path).expect(404);
    expect(response.body.error).toMatchObject({ code, requestId: response.get("X-Request-Id") });
  });
});

describe("product image provider", () => {
  it.each([
    "http://fakestoreapi.com/img/product.png",
    "https://another.example/img/product.png",
    "https://fakestoreapi.com/products/1",
    "https://user@fakestoreapi.com/img/product.png",
  ])("substitutes a placeholder without fetching %s", async (url) => {
    const fetchPhoto = vi.fn();
    const provider = await createProductImageProvider(fetchPhoto);
    expect((await provider.get(url)).bytes).toEqual(placeholder);
    expect(fetchPhoto).not.toHaveBeenCalled();
  });

  it.each<[string, () => Response]>([
    ["a redirect", () => new Response(null, { status: 302, headers: { Location: "https://another.example/photo.png" } })],
    ["an unsupported type", () => new Response("<svg/>", { headers: { "Content-Type": "image/svg+xml" } })],
    ["a mismatched payload", () => new Response("not an image", { headers: { "Content-Type": "image/png" } })],
    ["an oversized stream", () => new Response(Buffer.alloc(2 * 1024 * 1024 + 1), { headers: { "Content-Type": "image/png" } })],
  ])("substitutes a placeholder for %s", async (_scenario, makeResponse) => {
    const provider = await createProductImageProvider(async () => makeResponse());
    expect((await provider.get(products[0].imageSource)).bytes).toEqual(placeholder);
  });
});
