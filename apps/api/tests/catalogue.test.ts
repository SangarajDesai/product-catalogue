import { describe, expect, it, vi } from "vitest";
import type { Product } from "../src/modules/catalogue/domain/product.js";
import { loadCatalogue } from "../src/modules/catalogue/application/load-catalogue.js";
import { readCatalogueConfig } from "../src/modules/catalogue/infrastructure/catalogue-config.js";
import { createFakeStoreRepository, createSnapshotRepository } from "../src/modules/catalogue/infrastructure/product-sources.js";

const { featured } = readCatalogueConfig({});
const products = await createSnapshotRepository().list();

describe("catalogue startup", () => {
  it("selects a valid live catalogue and leaves the snapshot unopened", async () => {
    const live = { list: vi.fn().mockResolvedValue(products) };
    const snapshot = { list: vi.fn().mockResolvedValue(products) };

    await expect(loadCatalogue({ mode: "live", live, snapshot, featured })).resolves.toEqual({ products, source: "live" });
    expect(live.list).toHaveBeenCalledTimes(1);
    expect(snapshot.list).not.toHaveBeenCalled();
  });

  it("loads the bundled catalogue directly in snapshot mode", async () => {
    const live = { list: vi.fn() };
    await expect(loadCatalogue({ mode: "snapshot", live, snapshot: createSnapshotRepository(), featured }))
      .resolves.toMatchObject({ products, source: "snapshot" });
    expect(live.list).not.toHaveBeenCalled();
  });

  it("normalizes live provider metadata before passing it to the application", async () => {
    const fetchProducts = vi.fn(async () => Response.json([{
      id: 5,
      title: " Example bracelet ",
      description: " Example description ",
      category: "jewelery",
      price: 109.95,
      image: "https://fakestoreapi.com/img/bracelet.png",
    }]));

    await expect(createFakeStoreRepository(fetchProducts).list()).resolves.toEqual([{
      id: 5,
      title: "Example bracelet",
      description: "Example description",
      category: { slug: "jewelery", name: "Jewellery" },
      price: { amount: 109.95, currency: "INR" },
      imageSource: "https://fakestoreapi.com/img/bracelet.png",
    }]);
    expect(fetchProducts).toHaveBeenCalledWith("https://fakestoreapi.com/products", expect.objectContaining({
      redirect: "error",
      signal: expect.any(AbortSignal),
    }));
  });

  it.each([
    ["upstream request failure", async () => new Response(null, { status: 503 }), "UPSTREAM_UNAVAILABLE"],
    ["timeout", async () => { throw new DOMException("Provider timeout", "TimeoutError"); }, "UPSTREAM_UNAVAILABLE"],
    ["invalid provider data", async () => Response.json([{ id: 1, title: "Missing fields" }]), "INVALID_CATALOGUE_DATA"],
  ])("falls back after %s", async (_scenario, fetchProducts, fallbackReason) => {
    const live = createFakeStoreRepository(fetchProducts);
    await expect(loadCatalogue({ mode: "live", live, snapshot: createSnapshotRepository(), featured }))
      .resolves.toMatchObject({ products, source: "snapshot", fallbackReason });
  });

  it.each<[string, readonly Product[], string]>([
    ["duplicate IDs", [...products, products[0]], "INVALID_CATALOGUE_DATA"],
    ["an absent home pick", products.filter(({ id }) => id !== 2), "FEATURED_SELECTION_MISMATCH"],
    ["a category pick in the wrong category", products.map((product) => product.id === 5
      ? { ...product, category: products[0].category }
      : product), "FEATURED_SELECTION_MISMATCH"],
  ])("falls back when the live catalogue contains %s", async (_scenario, liveProducts, fallbackReason) => {
    const live = { list: async () => liveProducts };
    await expect(loadCatalogue({ mode: "live", live, snapshot: createSnapshotRepository(), featured }))
      .resolves.toMatchObject({ products, source: "snapshot", fallbackReason });
  });

  it("refuses to start when neither source can satisfy the curation", async () => {
    const unavailable = { list: async () => [] };
    await expect(loadCatalogue({ mode: "live", live: unavailable, snapshot: unavailable, featured }))
      .rejects.toMatchObject({ reason: "FEATURED_SELECTION_MISMATCH" });
  });

  it("rejects repeated home IDs before contacting either source", async () => {
    const source = { list: vi.fn() };
    const duplicateHome = { ...featured, home: [1, 1, 5, 9, 15] };
    await expect(loadCatalogue({ mode: "live", live: source, snapshot: source, featured: duplicateHome }))
      .rejects.toMatchObject({ reason: "INVALID_CATALOGUE_CONFIGURATION" });
    expect(source.list).not.toHaveBeenCalled();
  });

  it("preserves the owner's ordered home picks and category overrides from configuration", () => {
    const config = readCatalogueConfig({
      CATALOGUE_SOURCE: "snapshot",
      CATALOGUE_FEATURED_HOME: "15, 9, 5, 2, 1",
      CATALOGUE_FEATURED_CATEGORIES: '{"mens-clothing":2,"jewelery":5,"electronics":9,"womens-clothing":15}',
    });

    expect(config.mode).toBe("snapshot");
    expect(config.featured.home).toEqual([15, 9, 5, 2, 1]);
    expect(config.featured.categories.get("mens-clothing")).toBe(2);
  });
});
