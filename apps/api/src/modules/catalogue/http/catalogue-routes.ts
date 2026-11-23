import { Router } from "express";
import type { createCatalogue } from "../application/catalogue.js";
import { CategoryNotFoundError } from "../application/errors/category-not-found-error.js";
import { ProductNotFoundError } from "../application/errors/product-not-found-error.js";
import type { Product } from "../domain/product.js";
import { HttpError } from "../../../shared/http/errors/http-error.js";
import type { BusinessErrorResponses } from "../../../shared/http/errors/to-http-error.js";
import { positiveIntegerParamSchema } from "../../../shared/http/schemas/positive-integer-param.schema.js";
import { categorySlugSchema, searchTermSchema } from "./schemas/catalogue-request.schema.js";

export const catalogueErrorResponses: BusinessErrorResponses = new Map([
  [ProductNotFoundError.code, { status: 404, message: "The product was not found." }],
  [CategoryNotFoundError.code, { status: 404, message: "The category was not found." }],
]);

function toProductSummary({ id, title, category, price }: Product) {
  return { id, title, category, price, imageUrl: `/api/products/${id}/image` };
}

function parseProductId(value: string) {
  const result = positiveIntegerParamSchema.safeParse(value);
  if (!result.success) throw new HttpError(400, "INVALID_INPUT", "The product ID must be a positive integer.");
  return result.data;
}

export function createCatalogueRoutes(catalogue: ReturnType<typeof createCatalogue>) {
  const router = Router();

  router.get("/categories", async (_request, response) => {
    response.json(await catalogue.listCategories());
  });

  router.get("/categories/:slug", async (request, response) => {
    const slug = categorySlugSchema.safeParse(request.params.slug);
    if (!slug.success) throw new CategoryNotFoundError();

    const { category, featured, products } = await catalogue.getCategory(slug.data);
    response.json({
      category,
      featured: toProductSummary(featured),
      products: products.map(toProductSummary),
    });
  });

  router.get("/products", async (request, response) => {
    const term = searchTermSchema.safeParse(request.query.q);
    if (!term.success) throw new HttpError(400, "INVALID_INPUT", "Enter a search term.");

    const products = await catalogue.searchProducts(term.data);
    response.json(products.map(toProductSummary));
  });

  router.get("/products/featured", async (_request, response) => {
    const products = await catalogue.listFeatured();
    response.json(products.map(toProductSummary));
  });

  router.get("/products/:id", async (request, response) => {
    const product = await catalogue.getProduct(parseProductId(request.params.id));
    response.json({ ...toProductSummary(product), description: product.description });
  });

  router.get("/products/:id/image", async (request, response) => {
    const image = await catalogue.getProductImage(parseProductId(request.params.id));
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.type(image.contentType).send(Buffer.from(image.bytes));
  });

  return router;
}
