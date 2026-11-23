import { readFile } from "node:fs/promises";
import { CatalogueLoadError } from "../application/errors/catalogue-load-error.js";
import type { ProductRepository } from "../application/product-repository.js";
import type { Product } from "../domain/product.js";
import { readCatalogueResponseBody } from "./read-catalogue-response-body.js";
import { fakeStoreProductsSchema } from "./schemas/fake-store-products.schema.js";

export const fakeStoreOrigin = "https://fakestoreapi.com";
const snapshotFile = new URL("../../../../assets/catalogue/products.json", import.meta.url);

function parseProducts(json: string): readonly Product[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (cause) {
    throw new CatalogueLoadError("INVALID_CATALOGUE_DATA", { cause });
  }

  const result = fakeStoreProductsSchema.safeParse(data);
  if (!result.success) throw new CatalogueLoadError("INVALID_CATALOGUE_DATA");

  return result.data.map(({ id, title, description, category, price, image }) => {
    const slug = category.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) throw new CatalogueLoadError("INVALID_CATALOGUE_DATA");
    const name = slug === "jewelery" ? "Jewellery" : category[0].toUpperCase() + category.slice(1);

    return { id, title, description, category: { slug, name }, price: { amount: price, currency: "INR" }, imageSource: image };
  });
}

export function createFakeStoreRepository(fetchProducts: typeof fetch = fetch): ProductRepository {
  return {
    async list() {
      let json: string;
      try {
        const response = await fetchProducts(`${fakeStoreOrigin}/products`, {
          headers: { Accept: "application/json" },
          redirect: "error",
          signal: AbortSignal.timeout(3000),
        });
        if (!response.ok) {
          void response.body?.cancel().catch(() => undefined);
          throw new Error("Fake Store request failed.");
        }
        json = (await readCatalogueResponseBody(response, 512 * 1024)).toString("utf8");
      } catch (cause) {
        throw new CatalogueLoadError("UPSTREAM_UNAVAILABLE", { cause });
      }
      return parseProducts(json);
    },
  };
}

export function createSnapshotRepository(location = snapshotFile): ProductRepository {
  return {
    async list() {
      const json = await readFile(location, "utf8").catch((cause: unknown) => {
        throw new CatalogueLoadError("SNAPSHOT_UNAVAILABLE", { cause });
      });
      return parseProducts(json);
    },
  };
}
