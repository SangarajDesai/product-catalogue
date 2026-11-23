import type { Product } from "../domain/product.js";
import { CatalogueLoadError, type CatalogueLoadFailure } from "./errors/catalogue-load-error.js";
import type { ProductRepository } from "./product-repository.js";

export type FeaturedSelections = Readonly<{
  home: readonly number[];
  categories: ReadonlyMap<string, number>;
}>;

type LoadCatalogueOptions = {
  mode: "live" | "snapshot";
  live: ProductRepository;
  snapshot: ProductRepository;
  featured: FeaturedSelections;
};

type LoadedCatalogue = {
  products: readonly Product[];
  source: "live" | "snapshot";
  fallbackReason?: CatalogueLoadFailure;
};

function validateSelections(products: readonly Product[], featured: FeaturedSelections) {
  const byId = new Map<number, Product>();
  const categories = new Map<string, string>();

  for (const product of products) {
    const { slug, name } = product.category;
    const existingName = categories.get(slug);
    if (byId.has(product.id) || (existingName !== undefined && existingName !== name)) {
      throw new CatalogueLoadError("INVALID_CATALOGUE_DATA");
    }
    byId.set(product.id, product);
    categories.set(slug, name);
  }

  if (featured.home.some((id) => !byId.has(id)) || featured.categories.size !== categories.size) {
    throw new CatalogueLoadError("FEATURED_SELECTION_MISMATCH");
  }
  for (const [slug, id] of featured.categories) {
    if (byId.get(id)?.category.slug !== slug) {
      throw new CatalogueLoadError("FEATURED_SELECTION_MISMATCH");
    }
  }
}

async function loadValidated(repository: ProductRepository, featured: FeaturedSelections) {
  const products = await repository.list();
  validateSelections(products, featured);
  return products;
}

export async function loadCatalogue({ mode, live, snapshot, featured }: LoadCatalogueOptions): Promise<LoadedCatalogue> {
  if (featured.home.length !== 5 || new Set(featured.home).size !== 5) {
    throw new CatalogueLoadError("INVALID_CATALOGUE_CONFIGURATION");
  }

  let fallbackReason: CatalogueLoadFailure | undefined;
  if (mode === "live") {
    try {
      return { products: await loadValidated(live, featured), source: "live" };
    } catch (error) {
      fallbackReason = error instanceof CatalogueLoadError ? error.reason : "UPSTREAM_UNAVAILABLE";
    }
  }

  return { products: await loadValidated(snapshot, featured), source: "snapshot", fallbackReason };
}
