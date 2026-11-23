import { getJson } from "../../../shared/http/get-json";
import { categoryProductsSchema } from "./schemas/category-products.schema";
import { categoriesSchema } from "./schemas/category.schema";
import { productDetailSchema } from "./schemas/product-detail.schema";
import { productSummariesSchema } from "./schemas/product-summary.schema";

export function getCategories(signal?: AbortSignal) {
  return getJson("/api/categories", categoriesSchema, signal);
}

export function getCategoryProducts(slug: string, signal?: AbortSignal) {
  return getJson(`/api/categories/${encodeURIComponent(slug)}`, categoryProductsSchema, signal);
}

export function searchProducts(term: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ q: term });
  return getJson(`/api/products?${query}`, productSummariesSchema, signal);
}

export function getProduct(id: string, signal?: AbortSignal) {
  return getJson(`/api/products/${encodeURIComponent(id)}`, productDetailSchema, signal);
}
