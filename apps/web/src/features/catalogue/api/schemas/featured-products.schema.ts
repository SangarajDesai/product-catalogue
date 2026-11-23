import { z } from "zod";
import { productSummarySchema } from "./product-summary.schema";

export const featuredProductsSchema = z.array(productSummarySchema).length(5)
  .refine((products) => new Set(products.map(({ id }) => id)).size === products.length);
