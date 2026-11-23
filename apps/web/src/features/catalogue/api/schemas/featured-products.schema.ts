import { productSummariesSchema } from "./product-summary.schema";

export const featuredProductsSchema = productSummariesSchema.length(5)
  .refine((products) => new Set(products.map(({ id }) => id)).size === products.length);
