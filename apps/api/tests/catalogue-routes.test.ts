import { readFile } from "node:fs/promises";
import pino from "pino";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { createCatalogue } from "../src/modules/catalogue/application/catalogue.js";
import { catalogueErrorResponses, createCatalogueRoutes } from "../src/modules/catalogue/http/catalogue-routes.js";
import { createProductImageProvider } from "../src/modules/catalogue/infrastructure/product-images.js";
import { createSnapshotRepository } from "../src/modules/catalogue/infrastructure/product-sources.js";

const products = await createSnapshotRepository().list();
const placeholder = await readFile(new URL("../assets/catalogue/placeholder.png", import.meta.url));
const tinyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aHQAAAAASUVORK5CYII=", "base64");

async function setup(fetchPhoto: typeof fetch) {
  const imageProvider = await createProductImageProvider(fetchPhoto);
  const catalogue = createCatalogue({ list: async () => products }, imageProvider, [15, 9, 1, 5, 2]);
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
