import { Router } from "express";
import type { createCatalogue } from "../application/catalogue.js";
import { ProductNotFoundError } from "../application/errors/product-not-found-error.js";
import { HttpError } from "../../../shared/http/errors/http-error.js";
import type { BusinessErrorResponses } from "../../../shared/http/errors/to-http-error.js";

export const catalogueErrorResponses: BusinessErrorResponses = new Map([
  [ProductNotFoundError.code, { status: 404, message: "The product was not found." }],
]);

export function createCatalogueRoutes(catalogue: ReturnType<typeof createCatalogue>) {
  const router = Router();

  router.get("/products/featured", async (_request, response) => {
    const products = await catalogue.listFeatured();
    response.json(products.map(({ id, title, category, price }) => ({
      id,
      title,
      category,
      price,
      imageUrl: `/api/products/${id}/image`,
    })));
  });

  router.get("/products/:id/image", async (request, response) => {
    const id = Number(request.params.id);
    if (!/^[1-9][0-9]*$/.test(request.params.id) || !Number.isSafeInteger(id)) {
      throw new HttpError(400, "INVALID_INPUT", "The product ID must be a positive integer.");
    }

    const image = await catalogue.getProductImage(id);
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.type(image.contentType).send(Buffer.from(image.bytes));
  });

  return router;
}
