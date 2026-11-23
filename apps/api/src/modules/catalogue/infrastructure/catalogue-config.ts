import type { FeaturedSelections } from "../application/load-catalogue.js";
import { CatalogueLoadError } from "../application/errors/catalogue-load-error.js";
import { catalogueConfigSchema } from "./schemas/catalogue-config.schema.js";

const defaultHome = "1,2,5,9,15";
const defaultCategories = '{"mens-clothing":1,"jewelery":5,"electronics":9,"womens-clothing":15}';

export function readCatalogueConfig(env: Readonly<Record<string, string | undefined>>): {
  mode: "live" | "snapshot";
  featured: FeaturedSelections;
} {
  const mode = env.CATALOGUE_SOURCE?.trim() || "live";
  const home = (env.CATALOGUE_FEATURED_HOME?.trim() || defaultHome).split(",");
  let categories: unknown;
  try {
    categories = JSON.parse(env.CATALOGUE_FEATURED_CATEGORIES?.trim() || defaultCategories);
  } catch {
    throw new CatalogueLoadError("INVALID_CATALOGUE_CONFIGURATION");
  }

  const config = catalogueConfigSchema.safeParse({ mode, home, categories });
  if (!config.success) throw new CatalogueLoadError("INVALID_CATALOGUE_CONFIGURATION");
  return { mode: config.data.mode, featured: { home: config.data.home, categories: new Map(Object.entries(config.data.categories)) } };
}
