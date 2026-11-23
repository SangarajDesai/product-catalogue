import { getJson } from "../../../shared/http/get-json";
import { featuredProductsSchema } from "./schemas/featured-products.schema";

export function getFeaturedProducts(signal?: AbortSignal) {
  return getJson("/api/products/featured", featuredProductsSchema, signal);
}
